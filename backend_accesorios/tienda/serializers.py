from rest_framework import serializers
from django.db import transaction
from .models import (
    Plataforma, ProveedorReal as Proveedor, Courier, Material, LoteImportacion,
    Producto, ProductoImagen, VarianteProducto, Venta, DetalleVenta,
    Gasto, Configuracion, ItemLote, Cliente,
    PedidoWeb, DetallePedidoWeb
)

class ClienteSerializer(serializers.ModelSerializer):
    total_compras = serializers.IntegerField(read_only=True)
    total_gastado = serializers.IntegerField(read_only=True)
    es_recurrente = serializers.BooleanField(read_only=True)
    ultima_compra = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Cliente
        fields = '__all__'


class PlataformaSerializer(serializers.ModelSerializer):
    pais_display = serializers.CharField(source='get_pais_origen_display', read_only=True)

    class Meta:
        model = Plataforma
        fields = '__all__'


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'


class ProveedorSerializer(serializers.ModelSerializer):
    plataforma_nombre = serializers.CharField(source='plataforma.nombre', read_only=True)
    plataforma_pais = serializers.CharField(source='plataforma.get_pais_origen_display', read_only=True)
    calificacion_calidad = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)

    class Meta:
        model = Proveedor
        fields = '__all__'


class CourierSerializer(serializers.ModelSerializer):
    tipo_servicio_display = serializers.CharField(source='get_tipo_servicio_display', read_only=True)

    class Meta:
        model = Courier
        fields = '__all__'


class VarianteProductoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_categoria = serializers.CharField(source='producto.get_categoria_display', read_only=True)
    producto_genero = serializers.CharField(source='producto.get_genero_display', read_only=True)
    precio_venta_pyg = serializers.IntegerField(source='precio_efectivo', read_only=True)
    costo_pyg = serializers.IntegerField(source='producto.costo_pyg', read_only=True)
    imagen_url = serializers.SerializerMethodField()
    # ``imagen_url`` es la URL efectiva que se muestra al cliente. Este campo
    # permite editar la URL propia de la variante sin perder el fallback del producto.
    imagen_url_propia = serializers.URLField(
        source='imagen_url', write_only=True, required=False, allow_null=True, allow_blank=True
    )

    class Meta:
        model = VarianteProducto
        fields = (
            'id', 'producto', 'producto_nombre', 'producto_categoria', 'producto_genero',
            'color', 'talle_medida', 'sku', 'stock', 'precio_venta', 'codigo_barras',
            'precio_venta_pyg', 'costo_pyg', 'imagen_url', 'imagen_url_propia', 'activo'
        )

    def get_imagen_url(self, obj):
        # Archivo de la variante → URL propia de la variante → archivo del producto → URL del producto.
        try:
            if obj.imagen_archivo:
                return obj.imagen_archivo.url
        except ValueError:
            pass
        if obj.imagen_url:
            return obj.imagen_url
        try:
            if obj.producto.imagen_archivo:
                return obj.producto.imagen_archivo.url
        except ValueError:
            pass
        return obj.producto.imagen_url or None


class ItemLoteSerializer(serializers.ModelSerializer):
    producto_id = serializers.IntegerField(source='producto.id', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_categoria = serializers.CharField(source='producto.get_categoria_display', read_only=True)
    producto_genero = serializers.CharField(source='producto.get_genero_display', read_only=True)
    lote_referencia = serializers.CharField(source='lote.nombre_referencia', read_only=True)
    proveedor_nombre = serializers.SerializerMethodField()
    proveedor_historico = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all(), required=False, allow_null=True)
    costo_unitario_final = serializers.IntegerField(read_only=True)

    class Meta:
        model = ItemLote
        fields = (
            'id', 'producto', 'producto_id', 'producto_nombre', 'producto_categoria', 'producto_genero',
            'lote', 'lote_referencia', 'proveedor_nombre', 'proveedor_historico', 'cantidad',
            'costo_unitario_pyg', 'costo_moneda_origen_historico', 'moneda_compra_historica',
            'tipo_cambio_historico', 'costo_pyg_historico', 'costo_unitario_final'
        )

    def get_proveedor_nombre(self, obj):
        if obj.proveedor_historico:
            return obj.proveedor_historico.nombre
        if hasattr(obj.producto, 'proveedor_real') and obj.producto.proveedor_real:
            return obj.producto.proveedor_real.nombre
        return 'Sin asignar'


class ProductoImagenSerializer(serializers.ModelSerializer):
    url = serializers.CharField(source='url_completa', read_only=True)

    class Meta:
        model = ProductoImagen
        fields = ('id', 'producto', 'imagen_url', 'imagen_archivo', 'url', 'color', 'orden')


class ProductoSerializer(serializers.ModelSerializer):
    variantes = VarianteProductoSerializer(many=True, read_only=True)
    materiales = MaterialSerializer(many=True, read_only=True)
    imagenes_galeria = ProductoImagenSerializer(many=True, read_only=True)
    materiales_ids = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(), many=True, write_only=True, source='materiales', required=False
    )
    proveedor_nombre = serializers.SerializerMethodField()
    proveedores_historial = serializers.SerializerMethodField()
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    genero_display = serializers.CharField(source='get_genero_display', read_only=True)
    stock_total = serializers.IntegerField(read_only=True)
    ganancia_estimada_unitaria = serializers.IntegerField(read_only=True)
    margen_porcentaje = serializers.FloatField(read_only=True)
    precio_unidad_calculado = serializers.IntegerField(read_only=True)
    imagen_url_completa = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = '__all__'

    def get_proveedor_nombre(self, obj):
        if hasattr(obj, 'proveedor_real') and obj.proveedor_real:
            return obj.proveedor_real.nombre
        return 'Sin asignar'

    def get_proveedores_historial(self, obj):
        items = getattr(obj, 'prefetched_itemlotes', None)
        if items is None:
            if hasattr(obj, 'itemlote_set'):
                items = list(obj.itemlote_set.all())
            else:
                items = []

        historial = []
        for item in items:
            if not item.lote:
                continue
            nombre_prov = item.proveedor_historico.nombre if item.proveedor_historico else (
                obj.proveedor_real.nombre if hasattr(obj, 'proveedor_real') and obj.proveedor_real else 'Proveedor'
            )
            historial.append({
                'lote_id': item.lote.id,
                'lote_nombre': item.lote.nombre_referencia or f'Lote #{item.lote.id}',
                'proveedor': nombre_prov,
                'cantidad': item.cantidad,
                'fecha': item.lote.fecha_creacion.strftime('%d/%m/%Y') if item.lote.fecha_creacion else None,
            })
        return historial

    def get_imagen_url_completa(self, obj):
        if obj.imagen_archivo:
            url = obj.imagen_archivo.url
            if url.startswith('http://') or url.startswith('https://'):
                return url
            # Cloudinary ya entrega una URL absoluta. Para almacenamiento local,
            # devolver /media/... evita enviar al celular a 127.0.0.1:8000.
            return url
        return obj.imagen_url or None


class LoteImportacionSerializer(serializers.ModelSerializer):
    courier_nombre = serializers.CharField(source='courier.nombre', read_only=True)
    tipo_envio_display = serializers.CharField(source='get_tipo_envio_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    costo_flete_por_gramo = serializers.FloatField(read_only=True)
    total_productos = serializers.IntegerField(read_only=True)
    items_detalle = ItemLoteSerializer(source='itemlote_set', many=True, read_only=True)

    class Meta:
        model = LoteImportacion
        fields = '__all__'


class DetalleVentaSerializer(serializers.ModelSerializer):
    variante_info = VarianteProductoSerializer(source='variante', read_only=True)
    subtotal = serializers.IntegerField(read_only=True)
    costo_subtotal = serializers.IntegerField(read_only=True)

    class Meta:
        model = DetalleVenta
        fields = ('id', 'variante', 'variante_info', 'cantidad', 'precio_unitario', 'subtotal', 'costo_subtotal')


class ItemVentaInputSerializer(serializers.Serializer):
    variante_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1, default=1)
    precio_unitario = serializers.IntegerField(required=False, allow_null=True)


class VentaCreateSerializer(serializers.ModelSerializer):
    cliente = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all(), required=False, allow_null=True)
    cliente_info = ClienteSerializer(source='cliente', read_only=True)
    items = ItemVentaInputSerializer(many=True, write_only=True)
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    ganancia_real = serializers.IntegerField(read_only=True)
    costo_total_pedido = serializers.IntegerField(read_only=True)

    class Meta:
        model = Venta
        fields = (
            'id', 'cliente', 'cliente_info', 'fecha_venta', 'metodo_pago', 'metodo_pago_display',
            'total_cobrado', 'cliente_nombre', 'cliente_telefono', 'notas',
            'items', 'detalles', 'ganancia_real', 'costo_total_pedido'
        )

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        with transaction.atomic():
            cliente = validated_data.get('cliente')
            cliente_nombre = (validated_data.get('cliente_nombre') or '').strip()
            cliente_telefono = (validated_data.get('cliente_telefono') or '').strip()

            # Si se escribió el nombre del cliente pero no se seleccionó de la lista,
            # registrarlo automáticamente en la base de datos de Clientes:
            if not cliente and cliente_nombre:
                if cliente_telefono:
                    cliente, _ = Cliente.objects.get_or_create(
                        telefono=cliente_telefono,
                        defaults={'nombre': cliente_nombre}
                    )
                else:
                    cliente, _ = Cliente.objects.get_or_create(
                        nombre__iexact=cliente_nombre,
                        defaults={'nombre': cliente_nombre}
                    )
                validated_data['cliente'] = cliente

            venta = Venta.objects.create(**validated_data)
            
            # Sincronizar snapshot de nombre y teléfono en la venta
            if venta.cliente:
                if not venta.cliente_nombre:
                    venta.cliente_nombre = venta.cliente.nombre
                if not venta.cliente_telefono and venta.cliente.telefono:
                    venta.cliente_telefono = venta.cliente.telefono
                venta.save(update_fields=['cliente_nombre', 'cliente_telefono'])

            for item in items_data:
                variante = VarianteProducto.objects.get(id=item['variante_id'])
                precio = item.get('precio_unitario') or variante.precio_efectivo or 0
                
                DetalleVenta.objects.create(
                    venta=venta,
                    variante=variante,
                    cantidad=item['cantidad'],
                    precio_unitario=precio
                )
            
            if not venta.total_cobrado or venta.total_cobrado == 0:
                venta.calcular_total_automatico()
                
            return venta


class VentaHistorialClienteSerializer(serializers.ModelSerializer):
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    detalles = DetalleVentaSerializer(many=True, read_only=True)

    class Meta:
        model = Venta
        fields = ('id', 'fecha_venta', 'metodo_pago', 'metodo_pago_display', 'total_cobrado', 'notas', 'detalles')


class ClienteDetalleSerializer(serializers.ModelSerializer):
    total_compras = serializers.IntegerField(read_only=True)
    total_gastado = serializers.IntegerField(read_only=True)
    es_recurrente = serializers.BooleanField(read_only=True)
    ultima_compra = serializers.DateTimeField(read_only=True)
    ventas = VentaHistorialClienteSerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = '__all__'


class GastoSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = Gasto
        fields = '__all__'


class ConfiguracionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuracion
        fields = '__all__'


# ── Pedidos Web ───────────────────────────────────────────────────────────────

class DetallePedidoWebSerializer(serializers.ModelSerializer):
    subtotal = serializers.IntegerField(read_only=True)
    variante_color = serializers.CharField(source='variante.color', read_only=True)
    variante_talle = serializers.CharField(source='variante.talle', read_only=True)
    imagen_url = serializers.CharField(source='variante.imagen_url', read_only=True)

    class Meta:
        model = DetallePedidoWeb
        fields = [
            'id', 'variante', 'variante_color', 'variante_talle',
            'imagen_url', 'nombre_producto', 'grabado_texto',
            'cantidad', 'precio_unitario', 'subtotal',
        ]


class PedidoWebSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoWebSerializer(many=True, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_envio_display = serializers.CharField(source='get_tipo_envio_display', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)

    class Meta:
        model = PedidoWeb
        fields = '__all__'


class DetallePedidoWebCreateSerializer(serializers.Serializer):
    variante_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)
    precio_unitario = serializers.IntegerField(min_value=0)
    nombre_producto = serializers.CharField(max_length=200)
    grabado_texto = serializers.CharField(required=False, allow_blank=True, default='')


class PedidoWebCreateSerializer(serializers.Serializer):
    """Serializer para crear un pedido desde la tienda pública."""
    cliente_nombre = serializers.CharField(max_length=120)
    cliente_telefono = serializers.CharField(max_length=40, required=False, allow_blank=True, default='')
    cliente_ci = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    cliente_ciudad = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    cliente_direccion = serializers.CharField(required=False, allow_blank=True, default='')
    tipo_envio = serializers.ChoiceField(choices=['villarrica', 'interior'])
    metodo_pago = serializers.ChoiceField(
        choices=['contimovil', 'billetera', 'transferencia', 'otro'],
        default='contimovil'
    )
    subtotal_productos = serializers.IntegerField(min_value=0)
    costo_envio = serializers.IntegerField(min_value=0, default=0)
    total_pedido = serializers.IntegerField(min_value=0)
    notas = serializers.CharField(required=False, allow_blank=True, default='')
    items = DetallePedidoWebCreateSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('El pedido debe tener al menos un producto.')
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        with transaction.atomic():
            pedido = PedidoWeb.objects.create(**validated_data)
            for item in items_data:
                variante = VarianteProducto.objects.get(pk=item['variante_id'])
                DetallePedidoWeb.objects.create(
                    pedido=pedido,
                    variante=variante,
                    cantidad=item['cantidad'],
                    precio_unitario=item['precio_unitario'],
                    nombre_producto=item['nombre_producto'],
                    grabado_texto=item.get('grabado_texto', ''),
                )
        return pedido
