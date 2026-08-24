from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, F, Count
import datetime

from .models import (
    Proveedor, Courier, Material, LoteImportacion, 
    Producto, VarianteProducto, Venta, DetalleVenta, 
    Gasto, Configuracion
)
from .serializers import (
    ProveedorSerializer, CourierSerializer, MaterialSerializer,
    LoteImportacionSerializer, ProductoSerializer, VarianteProductoSerializer,
    VentaCreateSerializer, GastoSerializer, ConfiguracionSerializer
)
from .services.currency import sincronizar_cotizaciones_en_bd


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'contacto']


class CourierViewSet(viewsets.ModelViewSet):
    queryset = Courier.objects.all()
    serializer_class = CourierSerializer


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.filter(activo=True).prefetch_related('variantes', 'materiales')
    serializer_class = ProductoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'variantes__sku', 'variantes__codigo_barras']

    def get_queryset(self):
        qs = super().get_queryset()
        categoria = self.request.query_params.get('categoria')
        genero = self.request.query_params.get('genero')
        lote_id = self.request.query_params.get('lote')

        if categoria:
            qs = qs.filter(categoria=categoria)
        if genero:
            qs = qs.filter(genero=genero)
        if lote_id:
            qs = qs.filter(lote_id=lote_id)

        return qs

    @action(detail=True, methods=['post'], url_path='upload-foto')
    def upload_foto(self, request, pk=None):
        """Recibe una foto (multipart/form-data) y la guarda en imagen_archivo del producto."""
        producto = self.get_object()
        foto = request.FILES.get('foto')

        if not foto:
            return Response({'error': 'No se recibió ninguna imagen.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar tipo de archivo
        tipos_permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
        if foto.content_type not in tipos_permitidos:
            return Response(
                {'error': f'Formato no soportado: {foto.content_type}. Usá JPG, PNG o WEBP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Borrar la foto anterior si existía
        if producto.imagen_archivo:
            try:
                producto.imagen_archivo.delete(save=False)
            except Exception:
                pass

        producto.imagen_archivo = foto
        producto.save(update_fields=['imagen_archivo'])

        return Response({
            'status': 'ok',
            'imagen_url': request.build_absolute_uri(producto.imagen_archivo.url)
        })


class VarianteProductoViewSet(viewsets.ModelViewSet):
    queryset = VarianteProducto.objects.filter(activo=True).select_related('producto')
    serializer_class = VarianteProductoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['sku', 'codigo_barras', 'producto__nombre', 'color', 'talle_medida']


class LoteImportacionViewSet(viewsets.ModelViewSet):
    queryset = LoteImportacion.objects.all().select_related('courier', 'proveedor_principal').prefetch_related('productos')
    serializer_class = LoteImportacionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre_referencia', 'tracking_origen', 'tracking_courier']

    @action(detail=True, methods=['post'])
    def actualizar_flete(self, request, pk=None):
        """Actualiza el kilaje y flete del lote y recalcula los productos automáticamente"""
        lote = self.get_object()
        peso_gramos = request.data.get('peso_total_gramos')
        flete_pyg = request.data.get('costo_flete_total_pyg')

        if peso_gramos is not None:
            lote.peso_total_gramos = int(peso_gramos)
        if flete_pyg is not None:
            lote.costo_flete_total_pyg = int(flete_pyg)
        
        estado = request.data.get('estado')
        if estado:
            lote.estado = estado

        lote.save()

        # Recalcular costos de productos asociados
        for producto in lote.productos.all():
            producto.costo_pyg = producto.calcular_costo_landed()
            producto.save()

        return Response({
            'message': 'Flete y costos de productos recalculados exitosamente',
            'costo_flete_por_gramo': lote.costo_flete_por_gramo
        })


class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().prefetch_related('detalles__variante__producto')
    serializer_class = VentaCreateSerializer


class GastoViewSet(viewsets.ModelViewSet):
    queryset = Gasto.objects.all()
    serializer_class = GastoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['descripcion', 'comprobante']


class ConfiguracionViewSet(viewsets.ViewSet):
    def list(self, request):
        config = Configuracion.get_config()
        serializer = ConfiguracionSerializer(config)
        return Response(serializer.data)

    def create(self, request):
        config = Configuracion.get_config()
        serializer = ConfiguracionSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='sync-rates')
    def sync_rates(self, request):
        """Disparador para actualizar las cotizaciones desde la API"""
        try:
            tasas = sincronizar_cotizaciones_en_bd()
            config = Configuracion.get_config()
            return Response({
                'status': 'success',
                'message': 'Cotizaciones sincronizadas en tiempo real',
                'rates': tasas,
                'config': ConfiguracionSerializer(config).data
            })
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def dashboard_stats(request):
    """Retorna las métricas clave para el dashboard de finanzas e inventario"""
    ahora = timezone.now()
    inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    inicio_hoy = ahora.replace(hour=0, minute=0, second=0, microsecond=0)

    # Ventas
    ventas_hoy = Venta.objects.filter(fecha_venta__gte=inicio_hoy)
    total_ventas_hoy = sum(v.total_cobrado for v in ventas_hoy)
    ganancia_hoy = sum(v.ganancia_real for v in ventas_hoy)

    ventas_mes = Venta.objects.filter(fecha_venta__gte=inicio_mes)
    total_ventas_mes = sum(v.total_cobrado for v in ventas_mes)
    ganancia_bruta_mes = sum(v.ganancia_real for v in ventas_mes)

    # Gastos
    gastos_mes = Gasto.objects.filter(fecha__gte=inicio_mes.date())
    total_gastos_mes = sum(g.monto_pyg for g in gastos_mes)

    # Utilidad neta real del negocio este mes
    utilidad_neta_mes = ganancia_bruta_mes - total_gastos_mes

    # Inventario
    variantes = VarianteProducto.objects.filter(activo=True).select_related('producto')
    total_unidades_stock = sum(v.stock for v in variantes)
    valor_inventario_costo_pyg = sum(v.stock * v.producto.costo_pyg for v in variantes)
    valor_inventario_venta_pyg = sum(v.stock * v.producto.precio_venta for v in variantes)

    # Lotes en curso
    lotes_activos = LoteImportacion.objects.exclude(estado__in=['RECIBIDO', 'CANCELADO']).count()

    # Últimas 5 ventas
    ultimas_ventas = Venta.objects.order_by('-fecha_venta')[:5]
    ventas_recientes_data = VentaCreateSerializer(ultimas_ventas, many=True).data

    return Response({
        'resumen_financiero': {
            'total_ventas_hoy_pyg': total_ventas_hoy,
            'ganancia_hoy_pyg': ganancia_hoy,
            'total_ventas_mes_pyg': total_ventas_mes,
            'ganancia_bruta_mes_pyg': ganancia_bruta_mes,
            'total_gastos_mes_pyg': total_gastos_mes,
            'utilidad_neta_mes_pyg': utilidad_neta_mes,
        },
        'inventario': {
            'total_unidades_stock': total_unidades_stock,
            'valor_costo_pyg': valor_inventario_costo_pyg,
            'valor_venta_pyg': valor_inventario_venta_pyg,
            'lotes_en_transito': lotes_activos,
        },
        'ultimas_ventas': ventas_recientes_data
    })
