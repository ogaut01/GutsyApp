from rest_framework import serializers
from django.db import transaction
from .models import (
    ProveedorReal as Proveedor, Courier, Material, LoteImportacion,
    Producto, VarianteProducto, Venta, DetalleVenta,
    Gasto, Configuracion, ItemLote, Cliente
)

class ClienteSerializer(serializers.ModelSerializer):
    total_compras = serializers.IntegerField(read_only=True)
    total_gastado = serializers.IntegerField(read_only=True)
    es_recurrente = serializers.BooleanField(read_only=True)
    ultima_compra = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Cliente
        fields = '__all__'


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'


class ProveedorSerializer(serializers.ModelSerializer):
    pais_display = serializers.CharField(source='get_pais_origen_display', read_only=True)

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
    imagen_url_propia = serializers.URLField(read_only=True)

    class Meta:
        model = VarianteProducto
        fields = (
            'id', 'producto', 'producto_nombre', 'producto_categoria', 'producto_genero',
            'color', 'talle_medida', 'sku', 'stock', 'precio_venta', 'codigo_barras',
            'precio_venta_pyg', 'costo_pyg', 'imagen_url', 'imagen_url_propia', 'activo'
        )

    def get_imagen_url(self, obj):
        # 1. La variante tiene imagen propia → la usa
        if obj.imagen_url:
            return obj.imagen_url
        # 2. El producto tiene imagen subida como archivo → la usa
        if obj.producto.imagen_archivo:
            return obj.producto.imagen_archivo.url
        # 3. Fallback: imagen URL del producto base
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


class ProductoSerializer(serializers.ModelSerializer):
    variantes = VarianteProductoSerializer(many=True, read_only=True)
    materiales = MaterialSerializer(many=True, read_only=True)
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
    imagen_url_completa = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = '__all__'

    def get_proveedor_nombre(self, obj):
        if hasattr(obj, 'proveedor_real') and obj.proveedor_real:
            return obj.proveedor_real.nombre
        return 'Sin asignar'

    def get_proveedores_historial(self, obj):
        from .models import ItemLote
        items = ItemLote.objects.filter(producto=obj).select_related('proveedor_historico', 'lote').order_by('-lote__fecha_creacion')
        historial = []
        for item in items:
            nombre_prov = item.proveedor_historico.nombre if item.proveedor_historico else (item.producto.proveedor_real.nombre if item.producto.proveedor_real else 'Proveedor')
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
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen_archivo.url)
            return obj.imagen_archivo.url
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
            venta = Venta.objects.create(**validated_data)
            
            # Si tiene cliente asignado pero no cliente_nombre/telefono, sincronizar snapshot
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
