from rest_framework import serializers
from django.db import transaction
from .models import (
    Proveedor, Courier, Material, LoteImportacion, 
    Producto, VarianteProducto, Venta, DetalleVenta, 
    Gasto, Configuracion
)

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
    precio_venta_pyg = serializers.IntegerField(source='producto.precio_venta', read_only=True)
    costo_pyg = serializers.IntegerField(source='producto.costo_pyg', read_only=True)
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = VarianteProducto
        fields = (
            'id', 'producto', 'producto_nombre', 'producto_categoria', 'producto_genero',
            'color', 'talle_medida', 'sku', 'stock', 'codigo_barras', 
            'precio_venta_pyg', 'costo_pyg', 'imagen_url', 'activo'
        )

    def get_imagen_url(self, obj):
        if obj.producto.imagen_archivo:
            return obj.producto.imagen_archivo.url
        return obj.producto.imagen_url or None


class ProductoSerializer(serializers.ModelSerializer):
    variantes = VarianteProductoSerializer(many=True, read_only=True)
    materiales = MaterialSerializer(many=True, read_only=True)
    materiales_ids = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(), many=True, write_only=True, source='materiales', required=False
    )
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    genero_display = serializers.CharField(source='get_genero_display', read_only=True)
    lote_referencia = serializers.CharField(source='lote.nombre_referencia', read_only=True)
    stock_total = serializers.IntegerField(read_only=True)
    ganancia_estimada_unitaria = serializers.IntegerField(read_only=True)
    margen_porcentaje = serializers.FloatField(read_only=True)
    imagen_url_completa = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = '__all__'

    def get_imagen_url_completa(self, obj):
        if obj.imagen_archivo:
            return obj.imagen_archivo.url
        return obj.imagen_url or None


class LoteImportacionSerializer(serializers.ModelSerializer):
    courier_nombre = serializers.CharField(source='courier.nombre', read_only=True)
    tipo_envio_display = serializers.CharField(source='get_tipo_envio_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    costo_flete_por_gramo = serializers.FloatField(read_only=True)
    total_productos = serializers.IntegerField(read_only=True)

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
    items = ItemVentaInputSerializer(many=True, write_only=True)
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    ganancia_real = serializers.IntegerField(read_only=True)
    costo_total_pedido = serializers.IntegerField(read_only=True)

    class Meta:
        model = Venta
        fields = (
            'id', 'fecha_venta', 'metodo_pago', 'metodo_pago_display',
            'total_cobrado', 'cliente_nombre', 'cliente_telefono', 'notas',
            'items', 'detalles', 'ganancia_real', 'costo_total_pedido'
        )

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        with transaction.atomic():
            venta = Venta.objects.create(**validated_data)
            
            for item in items_data:
                variante = VarianteProducto.objects.get(id=item['variante_id'])
                precio = item.get('precio_unitario') or variante.producto.precio_venta or 0
                
                DetalleVenta.objects.create(
                    venta=venta,
                    variante=variante,
                    cantidad=item['cantidad'],
                    precio_unitario=precio
                )
            
            if not venta.total_cobrado or venta.total_cobrado == 0:
                venta.calcular_total_automatico()
                
            return venta


class GastoSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = Gasto
        fields = '__all__'


class ConfiguracionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuracion
        fields = '__all__'
