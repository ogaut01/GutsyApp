from django.contrib import admin
from django.utils.html import format_html
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from .models import (
    Proveedor, Courier, Material, LoteImportacion, 
    Producto, VarianteProducto, Venta, DetalleVenta, 
    Gasto, Configuracion
)

from import_export import resources, fields, widgets

# Recursos para Importación / Exportación Masiva (Excel / CSV)
class ProductoResource(resources.ModelResource):
    proveedor = fields.Field(
        column_name='proveedor',
        attribute='proveedor',
        widget=widgets.ForeignKeyWidget(Proveedor, field='nombre')
    )

    class Meta:
        model = Producto
        fields = ('id', 'nombre', 'categoria', 'genero', 'proveedor', 'costo_moneda_origen', 'moneda_compra', 'peso_gramos', 'costo_pyg', 'precio_venta')
        export_order = ('id', 'nombre', 'categoria', 'genero', 'proveedor', 'costo_moneda_origen', 'moneda_compra', 'peso_gramos', 'costo_pyg', 'precio_venta')


class VarianteProductoResource(resources.ModelResource):
    producto = fields.Field(
        column_name='producto',
        attribute='producto',
        widget=widgets.ForeignKeyWidget(Producto, field='nombre')
    )

    class Meta:
        model = VarianteProducto
        fields = ('id', 'producto', 'color', 'talle_medida', 'sku', 'stock', 'codigo_barras')
        export_order = ('id', 'producto', 'color', 'talle_medida', 'sku', 'stock', 'codigo_barras')



@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'pais_origen', 'moneda_defecto', 'contacto', 'activo')
    list_filter = ('pais_origen', 'moneda_defecto', 'activo')
    search_fields = ('nombre', 'contacto')


@admin.register(Courier)
class CourierAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo_servicio', 'tarifa_aerea_usd_kg', 'tarifa_maritima_usd_kg', 'moneda_tarifa', 'contacto', 'activo')
    list_filter = ('tipo_servicio', 'moneda_tarifa', 'activo')
    search_fields = ('nombre', 'contacto')


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)


class ProductoInline(admin.TabularInline):
    model = Producto
    fields = ('nombre', 'categoria', 'genero', 'costo_moneda_origen', 'moneda_compra', 'peso_gramos', 'costo_pyg', 'precio_venta')
    readonly_fields = ('costo_pyg', 'precio_venta')
    extra = 0
    show_change_link = True


@admin.register(LoteImportacion)
class LoteImportacionAdmin(admin.ModelAdmin):
    list_display = (
        'nombre_referencia_display', 'courier', 'tipo_envio', 'estado', 
        'peso_kg_display', 'flete_pyg_display', 'costo_flete_por_gramo_display', 
        'total_productos_display', 'fecha_creacion'
    )
    list_filter = ('estado', 'tipo_envio', 'courier', 'fecha_creacion')
    search_fields = ('nombre_referencia', 'tracking_origen', 'tracking_courier')
    inlines = [ProductoInline]
    
    fieldsets = (
        ('Datos Principales del Envío', {
            'fields': ('nombre_referencia', 'courier', 'proveedor_principal', 'tipo_envio', 'estado')
        }),
        ('Seguimiento y Trackings', {
            'fields': ('tracking_origen', 'tracking_courier')
        }),
        ('Kilaje y Flete Cobrado en Paraguay', {
            'fields': ('peso_total_gramos', 'costo_flete_total_pyg', 'otros_gastos_lote_pyg'),
            'description': 'Completa estos datos cuando el paquete llegue al país para prorratear automáticamente el flete a tus accesorios.'
        }),
        ('Notas', {
            'fields': ('notas',)
        }),
    )

    def nombre_referencia_display(self, obj):
        return obj.nombre_referencia or f"Lote #{obj.id}"
    nombre_referencia_display.short_description = "Lote"

    def peso_kg_display(self, obj):
        return f"{obj.peso_total_gramos / 1000.0:.2f} kg" if obj.peso_total_gramos else "0 kg"
    peso_kg_display.short_description = "Peso Facturado"

    def flete_pyg_display(self, obj):
        return f"Gs. {obj.costo_flete_total_pyg:,}".replace(",", ".")
    flete_pyg_display.short_description = "Flete Pagado"

    def costo_flete_por_gramo_display(self, obj):
        return f"Gs. {obj.costo_flete_por_gramo:,.1f}/g".replace(",", ".")
    costo_flete_por_gramo_display.short_description = "Flete / Gramo"

    def total_productos_display(self, obj):
        return f"{obj.total_productos} accesorios"
    total_productos_display.short_description = "Productos"


class VarianteProductoInline(admin.TabularInline):
    model = VarianteProducto
    fields = ('color', 'talle_medida', 'sku', 'stock', 'codigo_barras', 'activo')
    extra = 1


@admin.register(Producto)
class ProductoAdmin(ImportExportModelAdmin):
    resource_class = ProductoResource
    list_display = (
        'foto_thumb', 'nombre', 'categoria', 'genero', 
        'proveedor', 'costo_pyg_display', 'precio_venta_display', 
        'ganancia_display', 'stock_total_badge', 'activo'
    )
    list_filter = ('categoria', 'genero', 'proveedor', 'materiales', 'activo', 'fecha_creacion')
    search_fields = ('nombre', 'variantes__sku', 'variantes__codigo_barras')
    filter_horizontal = ('materiales',)
    inlines = [VarianteProductoInline]

    fieldsets = (
        ('Identificación del Modelo', {
            'fields': ('nombre', 'categoria', 'genero', 'materiales', 'proveedor', 'activo')
        }),
        ('Fotos y Enlaces', {
            'fields': ('imagen_archivo', 'imagen_url', 'url_producto', 'descripcion')
        }),
        ('Costeo de Importación', {
            'fields': ('lote', 'costo_moneda_origen', 'moneda_compra', 'peso_gramos', 'costo_pyg'),
            'description': 'El Costo Final en Guaraníes se calcula automáticamente sumando el precio FOB y el flete por peso.'
        }),
        ('Precio de Venta al Público', {
            'fields': ('precio_venta',),
            'description': 'Si dejas en 0, el sistema sugerirá automáticamente un precio según el margen de ganancia configurado.'
        }),
    )

    def foto_thumb(self, obj):
        if obj.imagen_archivo:
            return format_html('<img src="{}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" />', obj.imagen_archivo.url)
        elif obj.imagen_url:
            return format_html('<img src="{}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" />', obj.imagen_url)
        return "📷 Sin foto"
    foto_thumb.short_description = "Foto"

    def costo_pyg_display(self, obj):
        return f"Gs. {obj.costo_pyg:,}".replace(",", ".")
    costo_pyg_display.short_description = "Costo Real"

    def precio_venta_display(self, obj):
        return f"Gs. {obj.precio_venta:,}".replace(",", ".")
    precio_venta_display.short_description = "Precio Venta"

    def ganancia_display(self, obj):
        ganancia = obj.ganancia_estimada_unitaria
        ganancia_fmt = f"{int(ganancia):,}".replace(",", ".")
        color = "#28a745" if ganancia > 0 else "#dc3545"
        return format_html('<b style="color: {};">Gs. {} ({}%)</b>', color, ganancia_fmt, obj.margen_porcentaje)
    ganancia_display.short_description = "Margen Unitario"

    def stock_total_badge(self, obj):
        total = obj.stock_total
        color = "#28a745" if total > 3 else ("#ffc107" if total > 0 else "#dc3545")
        text_color = "#fff" if total != 1 and total != 2 else "#000"
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 3px 8px; border-radius: 10px; font-weight: bold;">{} u.</span>',
            color, text_color, total
        )
    stock_total_badge.short_description = "Stock Total"


@admin.register(VarianteProducto)
class VarianteProductoAdmin(ImportExportModelAdmin):
    resource_class = VarianteProductoResource
    list_display = ('sku', 'producto', 'color', 'talle_medida', 'stock_badge', 'activo')
    list_filter = ('producto__categoria', 'producto__genero', 'color', 'activo')
    search_fields = ('sku', 'producto__nombre', 'codigo_barras', 'color', 'talle_medida')

    def stock_badge(self, obj):
        color = "#28a745" if obj.stock > 2 else ("#ffc107" if obj.stock > 0 else "#dc3545")
        text_color = "#fff" if obj.stock > 2 or obj.stock == 0 else "#000"
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 3px 8px; border-radius: 10px; font-weight: bold;">{} unid.</span>',
            color, text_color, obj.stock
        )
    stock_badge.short_description = "Stock"


class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    fields = ('variante', 'cantidad', 'precio_unitario', 'subtotal_display', 'ganancia_display')
    readonly_fields = ('subtotal_display', 'ganancia_display')
    extra = 1
    autocomplete_fields = ['variante']

    def subtotal_display(self, obj):
        return f"Gs. {obj.subtotal:,}".replace(",", ".") if obj.pk else "-"
    subtotal_display.short_description = "Subtotal"

    def ganancia_display(self, obj):
        if obj.pk:
            ganancia = obj.subtotal - obj.costo_subtotal
            return f"Gs. {ganancia:,}".replace(",", ".")
        return "-"
    ganancia_display.short_description = "Ganancia Ítem"


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = (
        'id_display', 'fecha_display', 'metodo_pago_badge', 
        'total_cobrado_display', 'costo_total_display', 'ganancia_real_display', 
        'cliente_nombre'
    )
    list_filter = ('metodo_pago', 'fecha_venta')
    search_fields = ('id', 'cliente_nombre', 'cliente_telefono', 'notas')
    inlines = [DetalleVentaInline]

    fieldsets = (
        ('Información de la Venta', {
            'fields': ('fecha_venta', 'metodo_pago', 'total_cobrado')
        }),
        ('Datos del Cliente (Opcional)', {
            'fields': ('cliente_nombre', 'cliente_telefono')
        }),
        ('Notas', {
            'fields': ('notas',)
        }),
    )

    def id_display(self, obj):
        return f"Venta #{obj.id}"
    id_display.short_description = "Nro."

    def fecha_display(self, obj):
        return obj.fecha_venta.strftime('%d/%m/%Y %H:%M')
    fecha_display.short_description = "Fecha / Hora"

    def metodo_pago_badge(self, obj):
        return obj.get_metodo_pago_display()
    metodo_pago_badge.short_description = "Método de Pago"

    def total_cobrado_display(self, obj):
        return f"Gs. {obj.total_cobrado_format}"
    total_cobrado_display.short_description = "Total Cobrado"

    def costo_total_display(self, obj):
        return f"Gs. {int(obj.costo_total_pedido):,}".replace(",", ".")
    costo_total_display.short_description = "Costo Mercadería"

    def ganancia_real_display(self, obj):
        return format_html('<b style="color: #28a745; font-size: 1.05em;">Gs. {}</b>', obj.ganancia_real_format)
    ganancia_real_display.short_description = "Ganancia Neta"


@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'categoria_display', 'descripcion', 'monto_display', 'comprobante')
    list_filter = ('categoria', 'fecha')
    search_fields = ('descripcion', 'comprobante')

    def categoria_display(self, obj):
        return obj.get_categoria_display()
    categoria_display.short_description = "Categoría"

    def monto_display(self, obj):
        monto_fmt = f"{int(obj.monto_pyg):,}".replace(",", ".")
        return format_html('<span style="color: #c82333; font-weight: bold;">- Gs. {}</span>', monto_fmt)
    monto_display.short_description = "Monto (Gs.)"


from django.urls import path
from django.shortcuts import redirect
from django.contrib import messages
from .services.currency import sincronizar_cotizaciones_en_bd

@admin.register(Configuracion)
class ConfiguracionAdmin(admin.ModelAdmin):
    list_display = (
        '__str__', 'tipo_cambio_usd_display', 'tipo_cambio_brl_display', 
        'tipo_cambio_cny_display', 'tipo_cambio_ars_display', 'costo_kilo_aereo_usd', 
        'margen_sugerido_porcentaje', 'ultima_actualizacion'
    )
    actions = ['actualizar_cotizaciones_action']
    change_list_template = "admin/configuracion_changelist.html"

    def tipo_cambio_usd_display(self, obj):
        return f"Gs. {obj.tipo_cambio_usd:,}".replace(",", ".")
    tipo_cambio_usd_display.short_description = "USD ($)"

    def tipo_cambio_brl_display(self, obj):
        return f"Gs. {obj.tipo_cambio_brl:,}".replace(",", ".")
    tipo_cambio_brl_display.short_description = "BRL (R$)"

    def tipo_cambio_cny_display(self, obj):
        return f"Gs. {obj.tipo_cambio_cny:,}".replace(",", ".")
    tipo_cambio_cny_display.short_description = "CNY (¥)"

    def tipo_cambio_ars_display(self, obj):
        return f"Gs. {obj.tipo_cambio_ars:,}".replace(",", ".")
    tipo_cambio_ars_display.short_description = "ARS ($)"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('actualizar-cotizaciones/', self.admin_site.admin_view(self.actualizar_cotizaciones_view), name='actualizar_cotizaciones'),
        ]
        return custom_urls + urls

    def actualizar_cotizaciones_view(self, request):
        try:
            tasas = sincronizar_cotizaciones_en_bd()
            self.message_user(
                request, 
                f"✅ Cotizaciones actualizadas desde la API: USD: Gs. {tasas['USD']:,} | BRL: Gs. {tasas['BRL']:,} | CNY: Gs. {tasas['CNY']:,} | ARS: Gs. {tasas['ARS']:,}",
                messages.SUCCESS
            )
        except Exception as e:
            self.message_user(request, f"❌ Error al consultar la API: {str(e)}", messages.ERROR)
        return redirect('../')

    @admin.action(description="🔄 Actualizar cotizaciones seleccionadas desde la API")
    def actualizar_cotizaciones_action(self, request, queryset):
        self.actualizar_cotizaciones_view(request)

    def has_add_permission(self, request):
        return not Configuracion.objects.exists()
