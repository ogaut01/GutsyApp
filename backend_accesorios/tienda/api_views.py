from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, F, Count
from django.db.models.deletion import ProtectedError
from django.core.files.base import ContentFile
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError
import datetime

from .models import (
    Plataforma, ProveedorReal as Proveedor, Courier, Material, LoteImportacion,
    Producto, VarianteProducto, Venta, DetalleVenta,
    Gasto, Configuracion, ItemLote, Cliente
)
from .serializers import (
    PlataformaSerializer, ProveedorSerializer, CourierSerializer, MaterialSerializer,
    LoteImportacionSerializer, ProductoSerializer, VarianteProductoSerializer,
    VentaCreateSerializer, GastoSerializer, ConfiguracionSerializer,
    ItemLoteSerializer, ClienteSerializer, ClienteDetalleSerializer
)
from .services.currency import sincronizar_cotizaciones_en_bd


MAX_PRODUCT_IMAGE_DIMENSION = 1600
PRODUCT_IMAGE_WEBP_QUALITY = 85


def optimizar_foto_producto(foto):
    """Reduce fotos de producto sin deformarlas y las normaliza a WebP."""
    try:
        with Image.open(foto) as imagen_original:
            imagen = ImageOps.exif_transpose(imagen_original)
            imagen.thumbnail(
                (MAX_PRODUCT_IMAGE_DIMENSION, MAX_PRODUCT_IMAGE_DIMENSION),
                Image.Resampling.LANCZOS,
            )

            tiene_transparencia = imagen.mode in ('RGBA', 'LA') or 'transparency' in imagen.info
            imagen = imagen.convert('RGBA' if tiene_transparencia else 'RGB')
            contenido = BytesIO()
            opciones_webp = {'format': 'WEBP', 'method': 6}
            if tiene_transparencia:
                opciones_webp['lossless'] = True
            else:
                opciones_webp['quality'] = PRODUCT_IMAGE_WEBP_QUALITY
            imagen.save(contenido, **opciones_webp)
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError('No se pudo procesar la imagen seleccionada.') from exc

    nombre = f"{Path(foto.name).stem or 'producto'}.webp"
    return ContentFile(contenido.getvalue(), name=nombre)


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.filter(activo=True).prefetch_related('ventas__detalles__variante__producto')
    serializer_class = ClienteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'telefono', 'instagram', 'ciudad']

    def get_serializer_class(self):
        if self.action in ['retrieve', 'historial']:
            return ClienteDetalleSerializer
        return ClienteSerializer

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Resumen de métricas de clientes"""
        clientes = Cliente.objects.filter(activo=True)
        total_clientes = clientes.count()
        clientes_recurrentes = clientes.annotate(num_ventas=Count('ventas')).filter(num_ventas__gt=1).count()
        total_gastado = Venta.objects.filter(cliente__isnull=False).aggregate(total=Sum('total_cobrado'))['total'] or 0
        
        return Response({
            'total_clientes': total_clientes,
            'clientes_recurrentes': clientes_recurrentes,
            'total_facturado_clientes': total_gastado,
        })


class PlataformaViewSet(viewsets.ModelViewSet):
    queryset = Plataforma.objects.all()
    serializer_class = PlataformaSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'contacto']


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().select_related('plataforma')
    serializer_class = ProveedorSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'contacto', 'plataforma__nombre']


class CourierViewSet(viewsets.ModelViewSet):
    queryset = Courier.objects.all()
    serializer_class = CourierSerializer


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.filter(activo=True).select_related(
        'proveedor_real'
    ).prefetch_related(
        'variantes',
        'materiales',
        'itemlote_set__lote',
        'itemlote_set__proveedor_historico'
    )
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

        try:
            foto_optimizada = optimizar_foto_producto(foto)
            foto_anterior = producto.imagen_archivo.name if producto.imagen_archivo else None
            producto.imagen_archivo = foto_optimizada
            producto.save(update_fields=['imagen_archivo'])

            # La nueva foto ya se guardó correctamente; recién entonces se elimina la anterior.
            if foto_anterior and foto_anterior != producto.imagen_archivo.name:
                try:
                    producto.imagen_archivo.storage.delete(foto_anterior)
                except Exception:
                    pass

            url = producto.imagen_archivo.url

            return Response({
                'status': 'ok',
                'imagen_url': url
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Error al subir la imagen a la nube: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='catalogo-unificado')
    def catalogo_unificado(self, request):
        """
        Endpoint que devuelve un catálogo unificado de productos agrupados por nombre comercial.
        Evita mostrar duplicados en el frontend cuando el mismo modelo pertenece a múltiples proveedores.
        """
        # Obtener todos los productos activos con datos relacionados para evitar N+1
        productos = Producto.objects.filter(activo=True).select_related(
            'proveedor_real'
        ).prefetch_related(
            'variantes'
        )

        # Agrupar productos por nombre en memoria
        grupos = {}
        for producto in productos:
            nombre = producto.nombre
            if nombre not in grupos:
                grupos[nombre] = {
                    'productos': [],
                    'total_stock': 0,
                    'precios_venta': [],
                    'proveedores_ids': set()
                }

            grupos[nombre]['productos'].append(producto)
            # Calcular stock específico de este producto
            stock_producto = sum(variante.stock for variante in producto.variantes.all())
            grupos[nombre]['total_stock'] += stock_producto
            if producto.precio_venta:
                grupos[nombre]['precios_venta'].append(producto.precio_venta)
            if producto.proveedor_real:
                grupos[nombre]['proveedores_ids'].add(producto.proveedor_real.id)

        # Construir la respuesta
        resultado = []
        for nombre, datos in grupos.items():
            # Obtener precio_venta mínimo (ignorando ceros)
            precios_validos = [p for p in datos['precios_venta'] if p > 0]
            precio_venta = min(precios_validos) if precios_validos else 0

            # Construir lista de proveedores detallada
            proveedores_list = []
            for producto in datos['productos']:
                if producto.proveedor_real:
                    stock_especifico = sum(variante.stock for variante in producto.variantes.all())
                    proveedor_data = {
                        'id': producto.proveedor_real.id,
                        'nombre': producto.proveedor_real.nombre,
                        'costo_moneda_origen': str(producto.costo_moneda_origen) if producto.costo_moneda_origen else None,
                        'moneda_compra': producto.moneda_compra,
                        'stock_especifico': stock_especifico,
                        'url_producto': producto.imagen_archivo.url if producto.imagen_archivo else (producto.imagen_url or None)
                    }
                    proveedores_list.append(proveedor_data)

            resultado.append({
                'nombre': nombre,
                'stock_total': datos['total_stock'],
                'precio_venta': precio_venta,
                'total_proveedores': len(datos['proveedores_ids']),
                'proveedores': proveedores_list
            })

        return Response(resultado)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError as e:
            return Response(
                {'error': 'No se puede eliminar el producto porque tiene registros de ventas asociados.'},
                status=status.HTTP_400_BAD_REQUEST
            )

class VarianteProductoViewSet(viewsets.ModelViewSet):
    queryset = VarianteProducto.objects.filter(activo=True).select_related('producto')
    serializer_class = VarianteProductoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['sku', 'codigo_barras', 'producto__nombre', 'color', 'talle_medida']

    @action(detail=True, methods=['post'], url_path='upload-foto')
    def upload_foto(self, request, pk=None):
        """Guarda una foto optimizada exclusiva para esta variante."""
        variante = self.get_object()
        foto = request.FILES.get('foto')

        if not foto:
            return Response({'error': 'No se recibió ninguna imagen.'}, status=status.HTTP_400_BAD_REQUEST)

        tipos_permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
        if foto.content_type not in tipos_permitidos:
            return Response(
                {'error': f'Formato no soportado: {foto.content_type}. Usá JPG, PNG o WEBP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            foto_optimizada = optimizar_foto_producto(foto)
            foto_anterior = variante.imagen_archivo.name if variante.imagen_archivo else None
            variante.imagen_archivo = foto_optimizada
            variante.save(update_fields=['imagen_archivo'])
            if foto_anterior and foto_anterior != variante.imagen_archivo.name:
                try:
                    variante.imagen_archivo.storage.delete(foto_anterior)
                except Exception:
                    pass
            return Response({'status': 'ok', 'imagen_url': variante.imagen_archivo.url})
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'error': f'Error al subir la imagen: {str(exc)}'}, status=status.HTTP_400_BAD_REQUEST)


class LoteImportacionViewSet(viewsets.ModelViewSet):
    queryset = LoteImportacion.objects.all().select_related('courier', 'plataforma').prefetch_related('itemlote_set__producto', 'itemlote_set__proveedor_historico')
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

        # Guardar tasas de cambio fijas al actualizar el flete (momento de confirmación)
        lote.guardar_tasas_fijas()

        lote.save()

        # Recalcular costos de productos asociados y GUARDAR HISTORIAL
        for producto in lote.productos.all():
            # 1. Calcular el costo landed usando las tasas fijas del lote (actuales)
            costo_calculado = producto.calcular_costo_landed_for_lote(lote)

            # 2. Actualizar el costo_pyg actual del producto (para uso operativo)
            producto.costo_pyg = costo_calculado
            producto.save()

            # 3. GUARDAR EL HISTORIAL EN ITEMLOTE
            item_lote, created = ItemLote.objects.get_or_create(
                producto=producto,
                lote=lote,
                defaults={'cantidad': 1}  # La cantidad se actualizará abajo si es necesario
            )

            # Llenar los campos históricos con los valores usados en este cálculo
            item_lote.costo_moneda_origen_historico = producto.costo_moneda_origen
            item_lote.moneda_compra_historica = producto.moneda_compra or 'USD'
            
            tasa_map = {
                'USD': lote.tipo_cambio_usd_fijo,
                'BRL': lote.tipo_cambio_brl_fijo,
                'CNY': lote.tipo_cambio_cny_fijo,
                'ARS': lote.tipo_cambio_ars_fijo,
            }
            item_lote.tipo_cambio_historico = tasa_map.get(producto.moneda_compra, lote.tipo_cambio_usd_fijo)
            item_lote.costo_flete_por_gramo_historico = lote.costo_flete_por_gramo
            item_lote.costo_pyg_historico = costo_calculado
            # ⭐ GUARDAR EL PROVEEDOR HISTÓRICO (tienda específica de esta transacción)
            item_lote.proveedor_historico = producto.proveedor_real

            # Actualizar cantidad si es necesario (mantener la existente o usar la del request)
            cantidad_request = request.data.get(f'cantidad_{producto.id}')
            if cantidad_request is not None:
                item_lote.cantidad = int(cantidad_request)
            item_lote.save()

        return Response({
            'message': 'Flete y costos de productos recalculados exitosamente',
            'costo_flete_por_gramo': lote.costo_flete_por_gramo,
            'tasas_fijas_guardadas': {
                'usd': lote.tipo_cambio_usd_fijo,
                'brl': lote.tipo_cambio_brl_fijo,
                'cny': lote.tipo_cambio_cny_fijo,
                'ars': lote.tipo_cambio_ars_fijo,
                'fecha': lote.fecha_tasa_fija.strftime('%Y-%m-%d %H:%M:%S') if lote.fecha_tasa_fija else None
            }
        })


class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().prefetch_related('detalles__variante__producto', 'cliente').order_by('-fecha_venta')
    serializer_class = VentaCreateSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['cliente_nombre', 'cliente_telefono', 'notas', 'detalles__variante__producto__nombre', 'detalles__variante__sku']


class GastoViewSet(viewsets.ModelViewSet):
    queryset = Gasto.objects.all().order_by('-fecha', '-id')
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


class ItemLoteViewSet(viewsets.ModelViewSet):
    queryset = ItemLote.objects.all().select_related('producto', 'lote', 'proveedor_historico')
    serializer_class = ItemLoteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['producto__nombre', 'lote__nombre_referencia', 'producto__proveedor__nombre', 'proveedor_historico__nombre']


@api_view(['GET'])
def dashboard_stats(request):
    """
    Retorna métricas ejecutivas completas para el Dashboard:
    - Períodos dinámicos con comparación contra período anterior
    - Serie temporal para gráficos
    - Top productos más vendidos y más rentables
    - Diagnóstico de inventario y reposición
    - Estado de importaciones y fletes
    - Desglose de gastos y métodos de pago
    - Alertas críticas accionables
    """
    from datetime import datetime, timedelta
    from django.db.models import Sum, Count, F, Q, Avg
    from django.utils.dateparse import parse_date

    ahora = timezone.now()
    periodo = request.GET.get('periodo', '30d').lower()
    start_param = request.GET.get('start_date')
    end_param = request.GET.get('end_date')

    # 1. Definir rango actual y rango previo para comparación
    if start_param and end_param:
        try:
            d_start = parse_date(start_param)
            d_end = parse_date(end_param)
            fecha_inicio = timezone.make_aware(datetime.combine(d_start, datetime.min.time()))
            fecha_fin = timezone.make_aware(datetime.combine(d_end, datetime.max.time()))
            duracion_dias = (d_end - d_start).days + 1
            fecha_inicio_prev = fecha_inicio - timedelta(days=duracion_dias)
            fecha_fin_prev = fecha_inicio - timedelta(seconds=1)
            periodo_label = f"{d_start.strftime('%d/%m/%y')} - {d_end.strftime('%d/%m/%y')}"
        except Exception:
            duracion_dias = 30
            fecha_fin = ahora
            fecha_inicio = ahora - timedelta(days=30)
            fecha_inicio_prev = fecha_inicio - timedelta(days=30)
            fecha_fin_prev = fecha_inicio
            periodo_label = "Últimos 30 días"
    elif periodo == 'hoy':
        fecha_inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
        fecha_fin = ahora
        duracion_dias = 1
        fecha_inicio_prev = fecha_inicio - timedelta(days=1)
        fecha_fin_prev = fecha_inicio - timedelta(seconds=1)
        periodo_label = "Hoy"
    elif periodo == '7d':
        duracion_dias = 7
        fecha_fin = ahora
        fecha_inicio = ahora - timedelta(days=7)
        fecha_inicio_prev = fecha_inicio - timedelta(days=7)
        fecha_fin_prev = fecha_inicio
        periodo_label = "Últimos 7 días"
    elif periodo == '3m':
        duracion_dias = 90
        fecha_fin = ahora
        fecha_inicio = ahora - timedelta(days=90)
        fecha_inicio_prev = fecha_inicio - timedelta(days=90)
        fecha_fin_prev = fecha_inicio
        periodo_label = "Últimos 3 meses"
    elif periodo == '6m':
        duracion_dias = 180
        fecha_fin = ahora
        fecha_inicio = ahora - timedelta(days=180)
        fecha_inicio_prev = fecha_inicio - timedelta(days=180)
        fecha_fin_prev = fecha_inicio
        periodo_label = "Últimos 6 meses"
    elif periodo == '12m':
        duracion_dias = 365
        fecha_fin = ahora
        fecha_inicio = ahora - timedelta(days=365)
        fecha_inicio_prev = fecha_inicio - timedelta(days=365)
        fecha_fin_prev = fecha_inicio
        periodo_label = "Últimos 12 meses"
    else:  # 30d por defecto
        duracion_dias = 30
        fecha_fin = ahora
        fecha_inicio = ahora - timedelta(days=30)
        fecha_inicio_prev = fecha_inicio - timedelta(days=30)
        fecha_fin_prev = fecha_inicio
        periodo_label = "Últimos 30 días"

    # 2. Métricas del Período Actual (Evaluadas en memoria para evitar múltiples viajes a la BD)
    ventas_curr = list(Venta.objects.filter(fecha_venta__range=(fecha_inicio, fecha_fin)))
    ventas_prev = list(Venta.objects.filter(fecha_venta__range=(fecha_inicio_prev, fecha_fin_prev)))

    facturacion_bruta_curr = sum(v.total_cobrado for v in ventas_curr)
    facturacion_bruta_prev = sum(v.total_cobrado for v in ventas_prev)
    facturacion_neta_curr = facturacion_bruta_curr
    facturacion_neta_prev = facturacion_bruta_prev

    costo_mercaderia_curr = sum(v.costo_total_pedido for v in ventas_curr)
    costo_mercaderia_prev = sum(v.costo_total_pedido for v in ventas_prev)
    ganancia_bruta_curr = facturacion_neta_curr - costo_mercaderia_curr
    ganancia_bruta_prev = facturacion_neta_prev - costo_mercaderia_prev

    gastos_curr = list(Gasto.objects.filter(fecha__range=(fecha_inicio.date(), fecha_fin.date())))
    gastos_prev = list(Gasto.objects.filter(fecha__range=(fecha_inicio_prev.date(), fecha_fin_prev.date())))
    total_gastos_curr = sum(g.monto_pyg for g in gastos_curr)
    total_gastos_prev = sum(g.monto_pyg for g in gastos_prev)

    ganancia_neta_curr = ganancia_bruta_curr - total_gastos_curr
    ganancia_neta_prev = ganancia_bruta_prev - total_gastos_prev

    margen_neto_pct_curr = round((ganancia_neta_curr / facturacion_neta_curr * 100), 1) if facturacion_neta_curr > 0 else 0.0
    margen_neto_pct_prev = round((ganancia_neta_prev / facturacion_neta_prev * 100), 1) if facturacion_neta_prev > 0 else 0.0

    # Variaciones porcentuales seguras
    def calc_pct_change(curr, prev):
        if prev == 0:
            return 100.0 if curr > 0 else 0.0
        return round(((curr - prev) / abs(prev)) * 100, 1)

    diff_facturacion_pct = calc_pct_change(facturacion_bruta_curr, facturacion_bruta_prev)
    diff_facturacion_neta_pct = calc_pct_change(facturacion_neta_curr, facturacion_neta_prev)
    diff_ganancia_neta_pct = calc_pct_change(ganancia_neta_curr, ganancia_neta_prev)
    diff_margen_puntos = round(margen_neto_pct_curr - margen_neto_pct_prev, 1)

    # 3. Inventario Físico & Valorización
    variantes_activas = list(VarianteProducto.objects.filter(
        activo=True,
        producto__activo=True,
    ).select_related('producto'))
    total_unidades_stock = sum(v.stock for v in variantes_activas)
    valor_inventario_costo = sum(v.stock * (v.producto.costo_pyg or 0) for v in variantes_activas)
    valor_inventario_venta = sum(v.stock * (v.producto.precio_venta or 0) for v in variantes_activas)

    # Diagnóstico de Stock
    productos_stock_bajo = []
    productos_agotados = []
    stock_por_producto = {}
    for v in variantes_activas:
        stock_por_producto[v.producto_id] = stock_por_producto.get(v.producto_id, 0) + v.stock
        if v.stock == 0:
            productos_agotados.append({
                'variante_id': v.id,
                'producto_id': v.producto.id,
                'producto': v.producto.nombre,
                'color': v.color,
                'talle': v.talle_medida,
                'sku': v.sku,
                'stock': 0
            })
        elif v.stock <= 2:
            productos_stock_bajo.append({
                'variante_id': v.id,
                'producto_id': v.producto.id,
                'producto': v.producto.nombre,
                'color': v.color,
                'talle': v.talle_medida,
                'sku': v.sku,
                'stock': v.stock
            })

    # La alerta principal se mide por producto padre: un producto está agotado
    # únicamente si la suma de sus variantes activas es 0.
    productos_padre_agotados_count = sum(
        1 for stock_total in stock_por_producto.values() if stock_total == 0
    )

    # Detección de productos sin movimiento (sin ventas en los últimos 45 días) en 1 sola consulta
    hace_45_dias = ahora - timedelta(days=45)
    detalles_recientes_var_ids = set(DetalleVenta.objects.filter(venta__fecha_venta__gte=hace_45_dias).values_list('variante_id', flat=True))
    
    cand_sin_mov = [v for v in variantes_activas if v.stock > 0 and v.id not in detalles_recientes_var_ids]
    cand_ids = [v.id for v in cand_sin_mov]
    
    # Pre-obtener última venta por variante en 1 sola query
    ultimas_ventas = {}
    if cand_ids:
        for dv in DetalleVenta.objects.filter(variante_id__in=cand_ids).select_related('venta').order_by('venta__fecha_venta'):
            ultimas_ventas[dv.variante_id] = dv.venta.fecha_venta

    productos_sin_movimiento = []
    for v in cand_sin_mov:
        f_ult = ultimas_ventas.get(v.id)
        dias_sin_vender = (ahora.date() - f_ult.date()).days if f_ult else 90
        productos_sin_movimiento.append({
            'variante_id': v.id,
            'producto_id': v.producto.id,
            'producto': v.producto.nombre,
            'color': v.color,
            'talle': v.talle_medida,
            'stock': v.stock,
            'dias_sin_venta': dias_sin_vender
        })
    productos_sin_movimiento.sort(key=lambda x: x['dias_sin_venta'], reverse=True)

    # 4. Serie Temporal para el Gráfico (Calculada 100% en memoria)
    intervalos_dias = 1 if duracion_dias <= 31 else (7 if duracion_dias <= 120 else 30)
    chart_data = []
    step_cursor = fecha_inicio
    while step_cursor <= fecha_fin:
        step_end = min(step_cursor + timedelta(days=intervalos_dias), fecha_fin)
        
        v_step = [v for v in ventas_curr if step_cursor <= v.fecha_venta <= step_end]
        g_step = [g for g in gastos_curr if step_cursor.date() <= g.fecha <= step_end.date()]
        
        fac_step = sum(v.total_cobrado for v in v_step)
        cost_step = sum(v.costo_total_pedido for v in v_step)
        gast_step = sum(g.monto_pyg for g in g_step)
        gan_step = (fac_step - cost_step) - gast_step
        
        lbl = step_cursor.strftime('%d %b') if duracion_dias <= 90 else step_cursor.strftime('%b %Y')
        chart_data.append({
            'label': lbl,
            'fecha': step_cursor.strftime('%Y-%m-%d'),
            'facturacion': fac_step,
            'ganancia': max(0, gan_step),
            'pedidos': len(v_step),
        })
        step_cursor += timedelta(days=intervalos_dias)

    # 5. Rankings de Productos (Más vendidos vs Más rentables)
    ventas_curr_ids = [v.id for v in ventas_curr]
    detalles_periodo = DetalleVenta.objects.filter(venta_id__in=ventas_curr_ids).select_related('variante__producto')
    ventas_por_producto = {}
    ventas_por_variante = {}

    for d in detalles_periodo:
        # Por Variante
        var = d.variante
        v_key = var.id
        if v_key not in ventas_por_variante:
            ventas_por_variante[v_key] = {
                'variante_id': var.id,
                'producto_id': var.producto.id,
                'producto': var.producto.nombre,
                'color': var.color,
                'talle': var.talle_medida,
                'unidades': 0,
                'facturacion': 0,
                'costo_total': 0,
                'ganancia': 0,
            }
        ventas_por_variante[v_key]['unidades'] += d.cantidad
        ventas_por_variante[v_key]['facturacion'] += d.subtotal
        cost_u = var.producto.costo_pyg or 0
        ventas_por_variante[v_key]['costo_total'] += (cost_u * d.cantidad)
        ventas_por_variante[v_key]['ganancia'] += (d.subtotal - (cost_u * d.cantidad))

        # Por Producto Base
        p = var.producto
        p_key = p.id
        if p_key not in ventas_por_producto:
            ventas_por_producto[p_key] = {
                'producto_id': p.id,
                'producto': p.nombre,
                'categoria': p.get_categoria_display(),
                'unidades': 0,
                'facturacion': 0,
                'ganancia': 0,
            }
        ventas_por_producto[p_key]['unidades'] += d.cantidad
        ventas_por_producto[p_key]['facturacion'] += d.subtotal
        ventas_por_producto[p_key]['ganancia'] += (d.subtotal - (cost_u * d.cantidad))

    # Lista A: Más Vendidos (por unidades de variantes)
    top_mas_vendidos = sorted(ventas_por_variante.values(), key=lambda x: x['unidades'], reverse=True)[:6]

    # Lista B: Más Rentables (por ganancia generada a nivel de modelo)
    top_mas_rentables = sorted(ventas_por_producto.values(), key=lambda x: x['ganancia'], reverse=True)[:6]
    for p in top_mas_rentables:
        p['margen_pct'] = round((p['ganancia'] / p['facturacion'] * 100), 1) if p['facturacion'] > 0 else 0.0

    # 6. Estadísticas de Ventas & Ticket Promedio
    total_pedidos_curr = len(ventas_curr)
    unidades_vendidas_curr = sum(d.cantidad for d in detalles_periodo)
    ticket_promedio = int(round(facturacion_neta_curr / total_pedidos_curr)) if total_pedidos_curr > 0 else 0
    unidades_por_pedido = round(unidades_vendidas_curr / total_pedidos_curr, 1) if total_pedidos_curr > 0 else 0.0

    # Desglose de Métodos de Pago
    pagos_dict = {}
    for v in ventas_curr:
        met = v.metodo_pago
        lbl = v.get_metodo_pago_display()
        if met not in pagos_dict:
            pagos_dict[met] = {'codigo': met, 'label': lbl, 'monto': 0, 'count': 0}
        pagos_dict[met]['monto'] += v.total_cobrado
        pagos_dict[met]['count'] += 1
    
    desglose_pagos = list(pagos_dict.values())
    for p in desglose_pagos:
        p['porcentaje'] = round((p['monto'] / facturacion_bruta_curr * 100), 1) if facturacion_bruta_curr > 0 else 0.0
    desglose_pagos.sort(key=lambda x: x['monto'], reverse=True)

    # 7. Importaciones & Lotes
    config = Configuracion.get_config()
    lotes_todos = LoteImportacion.objects.all().select_related('courier').prefetch_related('itemlote_set__producto').order_by('-fecha_creacion')
    lotes_en_transito = [l for l in lotes_todos if l.estado not in ['RECIBIDO', 'CANCELADO']]
    
    # Calcular valor mercadería en tránsito (sumando ítems asociados)
    valor_transito_fob_pyg = 0
    flete_estimado_transito_pyg = 0
    for l in lotes_en_transito:
        tc = l.tipo_cambio_usd_fijo or config.tipo_cambio_usd
        # Mercadería
        for it in l.itemlote_set.all():
            costo_usd = float(it.costo_moneda_origen_historico or it.producto.costo_moneda_origen or 0)
            valor_transito_fob_pyg += int(costo_usd * tc * it.cantidad)
        # Flete
        if l.costo_flete_total_pyg > 0:
            flete_estimado_transito_pyg += l.costo_flete_total_pyg
        elif l.peso_total_gramos > 0:
            tarifa_usd = float(l.courier.tarifa_aerea_usd_kg if l.courier else config.costo_kilo_aereo_usd)
            flete_estimado_transito_pyg += int((l.peso_total_gramos / 1000.0) * tarifa_usd * tc)

    # Lotes con alerta de demora (> 15 días desde creación sin recibir)
    lotes_demorados = []
    lotes_recientes_data = []
    for l in lotes_todos[:5]:
        dias_desde = (ahora.date() - l.fecha_creacion).days if l.fecha_creacion else 0
        es_demorado = l.estado not in ['RECIBIDO', 'CANCELADO'] and dias_desde > 15
        if es_demorado:
            lotes_demorados.append({
                'id': l.id,
                'nombre': l.nombre_referencia or f"Lote #{l.id}",
                'courier': l.courier.nombre if l.courier else 'No asignado',
                'dias_transito': dias_desde
            })
        
        tc = l.tipo_cambio_usd_fijo or config.tipo_cambio_usd
        val_lote = sum(int(float(it.costo_moneda_origen_historico or it.producto.costo_moneda_origen or 0) * tc * it.cantidad) for it in l.itemlote_set.all())
        
        lotes_recientes_data.append({
            'id': l.id,
            'nombre': l.nombre_referencia or f"Lote #{l.id}",
            'courier': l.courier.nombre if l.courier else 'Sin courier',
            'estado': l.estado,
            'estado_display': l.get_estado_display(),
            'dias_transito': dias_desde,
            'valor_mercaderia_pyg': val_lote,
            'flete_pyg': l.costo_flete_total_pyg,
            'tracking': l.tracking_courier or l.tracking_origen or 'Sin tracking'
        })

    # 8. Desglose de Gastos Operativos por Categoría
    gastos_dict = {}
    for g in gastos_curr:
        cat = g.categoria
        lbl = g.get_categoria_display()
        if cat not in gastos_dict:
            gastos_dict[cat] = {'categoria': cat, 'label': lbl, 'monto': 0, 'count': 0}
        gastos_dict[cat]['monto'] += g.monto_pyg
        gastos_dict[cat]['count'] += 1
    
    desglose_gastos = list(gastos_dict.values())
    for g in desglose_gastos:
        g['porcentaje'] = round((g['monto'] / total_gastos_curr * 100), 1) if total_gastos_curr > 0 else 0.0
    desglose_gastos.sort(key=lambda x: x['monto'], reverse=True)

    # 9. Alertas Accionables
    alertas = []
    if productos_padre_agotados_count > 0:
        alertas.append({
            'tipo': 'agotados',
            'severidad': 'danger',
            'titulo': f'{productos_padre_agotados_count} productos agotados',
            'descripcion': 'Productos sin unidades disponibles que necesitan reposición urgente.',
            'accion_tab': 'inventory',
            'accion_label': 'Ver Productos Agotados'
        })
    if len(productos_stock_bajo) > 0:
        alertas.append({
            'tipo': 'stock_bajo',
            'severidad': 'warning',
            'titulo': f'{len(productos_stock_bajo)} variantes con stock bajo',
            'descripcion': f'Tienen 2 unidades o menos disponibles.',
            'accion_tab': 'inventory',
            'accion_label': 'Ver Stock Bajo'
        })
    if len(lotes_demorados) > 0:
        alertas.append({
            'tipo': 'lotes_demorados',
            'severidad': 'warning',
            'titulo': f'{len(lotes_demorados)} importaciones con más de 15 días',
            'descripcion': f'Verificar tracking con el Courier.',
            'accion_tab': 'imports',
            'accion_label': 'Revisar Envíos'
        })
    if len(productos_sin_movimiento) > 0:
        alertas.append({
            'tipo': 'sin_movimiento',
            'severidad': 'info',
            'titulo': f'{len(productos_sin_movimiento)} productos sin ventas (+45 días)',
            'descripcion': f'Oportunidad para armar promociones o liquidación.',
            'accion_tab': 'inventory',
            'accion_label': 'Ver Inactivos'
        })

    # 8. Metas Financieras Mensuales & Punto de Equilibrio (Mes Calendario Actual)
    config = Configuracion.get_config()
    # El valor 0 es válido: permite desactivar temporalmente un componente de la meta.
    # Solo se usa el valor por defecto si la configuración fuera realmente nula.
    cuota_deudas = config.meta_deuda_mensual_pyg if config.meta_deuda_mensual_pyg is not None else 1332000
    meta_ads = config.meta_ads_mensual_pyg if config.meta_ads_mensual_pyg is not None else 800000
    sueldo_libre = config.meta_sueldo_libre_pyg if config.meta_sueldo_libre_pyg is not None else 800000

    # Ventas y ganancia del mes calendario actual
    primer_dia_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    ventas_mes_actual = list(Venta.objects.filter(fecha_venta__gte=primer_dia_mes))
    facturacion_mes_actual = sum(v.total_cobrado for v in ventas_mes_actual)
    costos_mercaderia_mes_actual = sum(v.costo_total_pedido for v in ventas_mes_actual)
    ganancia_bruta_mes_actual = facturacion_mes_actual - costos_mercaderia_mes_actual

    gastos_mes_actual = list(Gasto.objects.filter(fecha__gte=primer_dia_mes.date()))
    gastos_reales_mes_actual = sum(g.monto_pyg for g in gastos_mes_actual)
    ganancia_neta_mes_actual = ganancia_bruta_mes_actual - gastos_reales_mes_actual

    # Margen comercial promedio (default 60% = 0.60)
    margen_comercial_decimal = (config.margen_sugerido_porcentaje or 60) / 100.0
    if margen_comercial_decimal <= 0 or margen_comercial_decimal >= 1:
        margen_comercial_decimal = 0.60

    # Meta Neta Objetivo: cubriendo las cuotas de deuda + tu sueldo libre en mano
    meta_neta_objetivo = cuota_deudas + sueldo_libre
    costos_totales_reales_mes = cuota_deudas + gastos_reales_mes_actual

    # Ventas necesarias dinámicas (se recalculan con los gastos reales incurridos):
    ventas_punto_equilibrio = int(round(costos_totales_reales_mes / margen_comercial_decimal)) if margen_comercial_decimal > 0 else 0
    ventas_meta_mensual = int(round((costos_totales_reales_mes + sueldo_libre) / margen_comercial_decimal)) if margen_comercial_decimal > 0 else 0

    # Progreso de meta y equilibrio basado en Ganancia Neta Real:
    pct_meta = round((ganancia_neta_mes_actual / meta_neta_objetivo) * 100, 1) if meta_neta_objetivo > 0 else 0.0
    pct_punto_equilibrio = round((ganancia_neta_mes_actual / cuota_deudas) * 100, 1) if cuota_deudas > 0 else (100.0 if ganancia_neta_mes_actual >= 0 else 0.0)

    if ganancia_neta_mes_actual < cuota_deudas:
        estado_meta = 'CUBRIENDO_COSTOS'
        faltante_equilibrio = max(0, cuota_deudas - ganancia_neta_mes_actual)
        faltante_meta = max(0, meta_neta_objetivo - ganancia_neta_mes_actual)
    elif ganancia_neta_mes_actual < meta_neta_objetivo:
        estado_meta = 'EQUILIBRIO_ALCANZADO'
        faltante_equilibrio = 0
        faltante_meta = max(0, meta_neta_objetivo - ganancia_neta_mes_actual)
    else:
        estado_meta = 'META_SUPERADA'
        faltante_equilibrio = 0
        faltante_meta = 0

    punto_equilibrio_meta_data = {
        'cuota_deudas': cuota_deudas,
        'meta_ads': meta_ads,
        'sueldo_libre': sueldo_libre,
        'costos_fijos_mes': cuota_deudas,
        'costos_totales_reales_mes': costos_totales_reales_mes,
        'meta_ganancia_bruta': meta_neta_objetivo,
        'meta_neta_objetivo': meta_neta_objetivo,
        'margen_comercial_pct': int(margen_comercial_decimal * 100),
        'ventas_punto_equilibrio': ventas_punto_equilibrio,
        'ventas_meta_mensual': ventas_meta_mensual,
        'facturacion_mes_actual': facturacion_mes_actual,
        'ganancia_bruta_mes_actual': ganancia_bruta_mes_actual,
        'gastos_reales_mes_actual': gastos_reales_mes_actual,
        'ganancia_neta_mes_actual': ganancia_neta_mes_actual,
        'pct_meta': max(0.0, min(100.0, pct_meta)),
        'pct_meta_real': pct_meta,
        'pct_punto_equilibrio': max(0.0, min(100.0, pct_punto_equilibrio)),
        'estado_meta': estado_meta,
        'faltante_equilibrio': faltante_equilibrio,
        'faltante_meta': faltante_meta,
        'pedidos_mes_actual': len(ventas_mes_actual)
    }

    return Response({
        'periodo': {
            'codigo': periodo,
            'label': periodo_label,
            'inicio': fecha_inicio.strftime('%Y-%m-%d'),
            'fin': fecha_fin.strftime('%Y-%m-%d'),
            'duracion_dias': duracion_dias
        },
        'kpis': {
            'facturacion_bruta': facturacion_bruta_curr,
            'diff_facturacion_bruta_pct': diff_facturacion_pct,
            'facturacion_neta': facturacion_neta_curr,
            'diff_facturacion_neta_pct': diff_facturacion_neta_pct,
            'ganancia_neta': ganancia_neta_curr,
            'diff_ganancia_neta_pct': diff_ganancia_neta_pct,
            'margen_neto_pct': margen_neto_pct_curr,
            'diff_margen_puntos': diff_margen_puntos,
            'valor_inventario_costo': valor_inventario_costo,
            'valor_inventario_venta': valor_inventario_venta,
            'total_unidades_stock': total_unidades_stock
        },
        'punto_equilibrio_meta': punto_equilibrio_meta_data,
        'grafico_evolucion': chart_data,
        'rankings': {
            'mas_vendidos': top_mas_vendidos,
            'mas_rentables': top_mas_rentables
        },
        'inventario_salud': {
            'unidades_stock': total_unidades_stock,
            'valor_costo': valor_inventario_costo,
            'valor_venta': valor_inventario_venta,
            'stock_bajo': productos_stock_bajo[:8],
            'agotados': productos_agotados[:8],
            'sin_movimiento': productos_sin_movimiento[:8]
        },
        'ventas_resumen': {
            'pedidos_totales': total_pedidos_curr,
            'unidades_vendidas': unidades_vendidas_curr,
            'ticket_promedio': ticket_promedio,
            'unidades_por_pedido': unidades_por_pedido,
            'desglose_pagos': desglose_pagos
        },
        'importaciones': {
            'en_transito_count': len(lotes_en_transito),
            'valor_mercaderia_transito_pyg': valor_transito_fob_pyg,
            'flete_estimado_transito_pyg': flete_estimado_transito_pyg,
            'lotes_recientes': lotes_recientes_data,
            'lotes_demorados_count': len(lotes_demorados)
        },
        'gastos_resumen': {
            'total_gastos': total_gastos_curr,
            'costo_mercaderia_vendida': costo_mercaderia_curr,
            'desglose_categorias': desglose_gastos
        },
        'alertas': alertas
    })

