import re
import uuid
from django.db import models, transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator


class Plataforma(models.Model):
    """Plataforma o marketplace donde realizas tus compras (ej: Shein, Alibaba, Amazon)"""
    PAISES = [
        ('CN', 'China '),
        ('BR', 'Brasil '),
        ('AR', 'Argentina '),
        ('US', 'Estados Unidos'),
        ('PY', 'Paraguay (Mayorista Local)'),
    ]

    nombre = models.CharField(
        max_length=80,
        help_text="Ej: Shein, AliExpress, Alibaba, Amazon, Mercado Libre, etc."
    )
    pais_origen = models.CharField(
        max_length=2,
        choices=PAISES,
        default='CN',
        verbose_name="País de Origen"
    )
    contacto = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Contacto / WhatsApp / Enlace"
    )
    moneda_defecto = models.CharField(
        max_length=3,
        choices=[('USD', 'USD ($)'), ('BRL', 'BRL (R$)'), ('CNY', 'CNY (¥)'), ('PYG', 'PYG (Gs.)'), ('ARS', 'ARS ($)')],
        default='USD',
        verbose_name="Moneda Habitual"
    )
    activo = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Plataforma"
        verbose_name_plural = "Plataformas"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_pais_origen_display().split()[0]})"


class ProveedorReal(models.Model):
    """Representa un vendedor específico dentro de una plataforma o una tienda directa"""
    plataforma = models.ForeignKey(
        Plataforma,
        on_delete=models.CASCADE,
        verbose_name="Plataforma",
        help_text="Shein, Alibaba, AliExpress, etc. (dejar vacío para tiendas directas)"
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name="Nombre del Proveedor",
        help_text="Ej: yiwustore, zuhan store, tienda directa, official store, etc."
    )
    contacto = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Contacto / WhatsApp / Enlace"
    )

    # Calidad del producto (1-5 estrellas). Vacío hasta evaluar mercadería recibida.
    calificacion_calidad = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Calificación de Calidad (1-5)",
        help_text="Opcional. Completar cuando ya hayas recibido y evaluado mercadería de este proveedor (1=muy mala, 5=excelente)."
    )

    # Métricas de rendimiento (se actualizan automáticamente)
    tiempo_envio_promedio_dias = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name="Tiempo de Envío Promedio (días)",
        help_text="Promedio de días desde compra hasta llegada a casilla Miami"
    )
    confiabilidad_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Confiabilidad (%)",
        help_text="Porcentaje de entregas sin problemas"
    )
    total_transacciones = models.PositiveIntegerField(
        default=0,
        verbose_name="Total de Transacciones"
    )

    activo = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        unique_together = ('plataforma', 'nombre')
        ordering = ['plataforma', 'nombre']

    def __str__(self):
        if self.plataforma:
            return f"{self.nombre} ({self.plataforma.nombre})"
        return f"{self.nombre} (Tienda Directa)"

    def actualizar_metricas(self):
        """Actualiza las métricas de rendimiento basado en los lotes asociados"""
        from django.db.models import Avg
        from django.core.exceptions import ValidationError

        # Para evitar importación circular, importamos dentro del método
        try:
            from tienda.models import LoteImportacion
        except ImportError:
            # Si no podemos importar, saltamos la actualización
            return

        # Obtener lotes asociados a este proveedor real que tienen tiempos reales
        lotes_con_tiempo = LoteImportacion.objects.filter(
            proveedor_real=self,
            tiempo_proveedor_miami__isnull=False
        )

        if lotes_con_tiempo.exists():
            # Calcular promedio de tiempo de envío
            avg_tiempo = lotes_con_tiempo.aggregate(Avg('tiempo_proveedor_miami'))['tiempo_proveedor_miami__avg']
            self.tiempo_envio_promedio_dias = round(avg_tiempo, 1) if avg_tiempo else None

            # Calcular confiabilidad basada en transacciones exitosas vs problemas
            # Por ahora asumimos que si tiene tiempo registrado es una transacción exitosa
            # En el futuro, podríamos agregar un campo para marcar problemas como daños, retrasos excesivos, etc.
            total_con_tiempo = lotes_con_tiempo.count()
            self.confiabilidad_porcentaje = 100.0  # Placeholder - mejorar con datos reales de problemas

            self.total_transacciones = total_con_tiempo
            self.save(update_fields=['tiempo_envio_promedio_dias', 'confiabilidad_porcentaje', 'total_transacciones'])


class Courier(models.Model):
    TIPOS_SERVICIO = [
        ('AER', 'Aéreo Internacional (Miami / China)'),
        ('MAR', 'Marítimo Internacional (Contenedor)'),
        ('TER', 'Terrestre Brasil (São Paulo / Foz do Iguaçu)'),
        ('ARG', 'Terrestre Argentina (BsAs / Clorinda)'),
        ('LOC', 'Delivery Local / Encomiendas Paraguay (24-48 hs)'),
    ]

    nombre = models.CharField(
        max_length=100,
        help_text="Ej: Saspy, Sendit, Flashbox, Transportadora del Este, etc."
    )
    tipo_servicio = models.CharField(
        max_length=3,
        choices=TIPOS_SERVICIO,
        default='AER',
        verbose_name="Tipo de Servicio Principal"
    )

    # ─── Rutas cubiertas (texto libre con checkboxes en frontend) ───
    cubre_eeuu_china = models.BooleanField(
        default=False,
        verbose_name="Cubre EE.UU. / China (Aéreo o Marítimo)"
    )
    cubre_brasil = models.BooleanField(
        default=False,
        verbose_name="Cubre Brasil (São Paulo, Foz do Iguaçu)"
    )
    cubre_argentina = models.BooleanField(
        default=False,
        verbose_name="Cubre Argentina (Buenos Aires, Clorinda)"
    )
    cubre_local_py = models.BooleanField(
        default=False,
        verbose_name="Cubre Entregas Locales en Paraguay"
    )

    # ─── Tarifas por kilaje (Internacional / Terrestre) ───
    tarifa_aerea_usd_kg = models.DecimalField(
        max_digits=6, decimal_places=2, default=0.00,
        verbose_name="Tarifa Aérea (USD/kg)"
    )
    tarifa_maritima_usd_kg = models.DecimalField(
        max_digits=6, decimal_places=2, default=0.00,
        verbose_name="Tarifa Marítima (USD/kg)"
    )
    tarifa_terrestre_kg = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00,
        verbose_name="Tarifa Terrestre por kg"
    )
    moneda_tarifa = models.CharField(
        max_length=3,
        choices=[('USD', 'USD'), ('BRL', 'BRL'), ('PYG', 'PYG'), ('ARS', 'ARS')],
        default='USD',
        verbose_name="Moneda de Cobro (Kilaje)"
    )

    # ─── Tarifas por BULTO (Solo envíos locales PY) ───
    cobra_por_bulto = models.BooleanField(
        default=False,
        verbose_name="¿Cobra por Tamaño de Bulto? (Local PY)"
    )
    tarifa_bulto_chico_pyg = models.PositiveIntegerField(
        default=0,
        verbose_name="Tarifa Bulto Chico (Gs.) — Hasta 1 kg"
    )
    tarifa_bulto_mediano_pyg = models.PositiveIntegerField(
        default=0,
        verbose_name="Tarifa Bulto Mediano (Gs.) — 1 a 5 kg"
    )
    tarifa_bulto_grande_pyg = models.PositiveIntegerField(
        default=0,
        verbose_name="Tarifa Bulto Grande (Gs.) — Más de 5 kg"
    )

    tiempo_entrega_estimado_dias = models.PositiveSmallIntegerField(
        default=7,
        verbose_name="Días Estimados de Entrega"
    )
    es_transportadora_local = models.BooleanField(
        default=False,
        verbose_name="¿Es Transportadora Local PY?",
        help_text="Si es True, solo se usa para consulta de cobertura interna, no aparece en lotes de importación."
    )
    ciudades_cobertura = models.TextField(
        blank=True,
        null=True,
        verbose_name="Ciudades de Cobertura en PY",
        help_text="Lista de ciudades separadas por coma. Ej: Asunción, CDE, Encarnación, Villarrica, Yhú"
    )
    contacto = models.CharField(max_length=150, blank=True, null=True, verbose_name="Teléfono / WhatsApp / Web")
    direccion_casilla = models.TextField(blank=True, null=True, verbose_name="Dirección de tu Casilla")
    activo = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Courier / Transportadora"
        verbose_name_plural = "Couriers y Transportadoras"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_servicio_display()})"


class Material(models.Model):
    nombre = models.CharField(
        max_length=80,
        unique=True,
        help_text="Ej: Acero Quirúrgico 316L, Cuero PU, Plata 925, Oro Laminado, Piedra Volcánica, etc."
    )
    descripcion = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        verbose_name = "Material"
        verbose_name_plural = "Materiales"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class LoteImportacion(models.Model):
    TIPOS_ENVIO = [
        ('AER', 'Aéreo (Rápido - Miami Casilla)'),
        ('MAR', 'Marítimo (Económico - Miami Carga)'),
        ('TER', 'Terrestre (Directo Brasil/Argentina)'),
    ]

    ESTADOS = [
        ('COMPRADO', '1. Comprado al Proveedor'),
        ('EN_CASILLA', '2. Recibido en Casilla Miami / Origen'),
        ('EN_TRANSITO', '3. En Vuelo / Transporte a Paraguay'),
        ('EN_COURIER_PY', '4. En Sucursal Courier PY (Listo para retiro)'),
        ('RECIBIDO', '5. Retirado e Ingresado a Depósito'),
        ('CANCELADO', 'Cancelado'),
    ]

    courier = models.ForeignKey(
        Courier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Courier / Transportadora"
    )
    plataforma = models.ForeignKey(
        Plataforma,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Plataforma",
        help_text="Shein, Alibaba, AliExpress, etc. (dejar vacío para compras directas)"
    )
    # Nota: La relación con ProveedorReal se maneja a través de los productos
    # (cada producto tiene su proveedor_real específico)
    tipo_envio = models.CharField(
        max_length=3,
        choices=TIPOS_ENVIO,
        default='AER',
        verbose_name="Tipo de Envío"
    )
    fecha_creacion = models.DateField(auto_now_add=True, verbose_name="Fecha de Registro")
    nombre_referencia = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Nombre / Referencia del Lote",
        help_text="Ej: 'Caja Shein Agosto 2026' o 'Paquete #45892 Flashbox'"
    )
    tracking_origen = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        verbose_name="Tracking Origen (Tienda → Casilla)",
        help_text="Guía con la que el proveedor envió el paquete a Miami"
    )
    tracking_courier = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        verbose_name="Tracking Courier (Casilla → Paraguay)",
        help_text="Código de guía o paquete emitido por el courier"
    )
    estado = models.CharField(
        max_length=15,
        choices=ESTADOS,
        default='COMPRADO',
        verbose_name="Estado Logístico"
    )
    peso_total_gramos = models.IntegerField(
        default=0,
        verbose_name="Peso Facturado por Courier (Gramos)",
        help_text="Peso total por el que el courier cobró al llegar a Paraguay (ej: 2500 gramos = 2.5 kg)"
    )
    costo_flete_total_pyg = models.IntegerField(
        default=0,
        verbose_name="Flete Pagado en Paraguay (Gs.)",
        help_text="Monto total en Guaraníes que pagaste al retirar el paquete en la sucursal"
    )
    otros_gastos_lote_pyg = models.IntegerField(
        default=0,
        verbose_name="Otros Gastos del Lote (Gs.)",
        help_text="Seguro de envío, tasa aduanera o delivery hasta tu local"
    )
    notas = models.TextField(blank=True, null=True, verbose_name="Notas / Observaciones")

    # Campos para almacenar tasas de cambio históricas fijas al momento del lote
    tipo_cambio_usd_fijo = models.IntegerField(
        blank=True, null=True,
        verbose_name="Tipo de Cambio USD Fijo (Gs.)",
        help_text="Tasa de cambio USD → PYG guardada al momento de crear/recibir el lote"
    )
    tipo_cambio_brl_fijo = models.IntegerField(
        blank=True, null=True,
        verbose_name="Tipo de Cambio BRL Fijo (Gs.)",
        help_text="Tasa de cambio BRL → PYG guardada al momento de crear/recibir el lote"
    )
    tipo_cambio_cny_fijo = models.IntegerField(
        blank=True, null=True,
        verbose_name="Tipo de Cambio CNY Fijo (Gs.)",
        help_text="Tasa de cambio CNY → PYG guardada al momento de crear/recibir el lote"
    )
    tipo_cambio_ars_fijo = models.IntegerField(
        blank=True, null=True,
        verbose_name="Tipo de Cambio ARS Fijo (Gs.)",
        help_text="Tasa de cambio ARS → PYG guardada al momento de crear/recibir el lote"
    )
    fecha_tasa_fija = models.DateTimeField(
        blank=True, null=True,
        verbose_name="Fecha de la Tasa Fija",
        help_text="Fecha y hora cuando se guardaron las tasas de cambio históricas"
    )
    costo_kilo_aereo_usd_fijo = models.DecimalField(
        max_digits=6, decimal_places=2, blank=True, null=True,
        verbose_name="Tarifa Aérea USD/kg Fija",
        help_text="Tarifa aérea en USD/kg guardada al momento de crear/recibir el lote"
    )
    costo_kilo_maritimo_usd_fijo = models.DecimalField(
        max_digits=6, decimal_places=2, blank=True, null=True,
        verbose_name="Tarifa Marítima USD/kg Fija",
        help_text="Tarifa marítima en USD/kg guardada al momento de crear/recibir el lote"
    )

    # Many-to-many relationship with Producto through ItemLote
    productos = models.ManyToManyField(
        'Producto',
        through='ItemLote',
        related_name='lotes',
        verbose_name="Productos en el Lote"
    )

    class Meta:
        verbose_name = "Lote de Importación"
        verbose_name_plural = "Lotes de Importación"
        ordering = ['-fecha_creacion', '-id']

    @property
    def costo_total_lote_pyg(self):
        return self.costo_flete_total_pyg + self.otros_gastos_lote_pyg

    @property
    def costo_flete_por_gramo(self):
        """Prorrateo exacto del flete en Gs. por cada gramo de producto"""
        if self.peso_total_gramos and self.peso_total_gramos > 0:
            return self.costo_total_lote_pyg / self.peso_total_gramos
        return 0

    @property
    def total_productos(self):
        return self.productos.count()

    def guardar_tasas_fijas(self):
        """Guarda las tasas de cambio actuales como históricas fijas para este lote"""
        from .models import Configuracion  # Evitar importación circular
        config = Configuracion.get_config()

        self.tipo_cambio_usd_fijo = config.tipo_cambio_usd
        self.tipo_cambio_brl_fijo = config.tipo_cambio_brl
        self.tipo_cambio_cny_fijo = config.tipo_cambio_cny
        self.tipo_cambio_ars_fijo = config.tipo_cambio_ars
        # Guardar también las tarifas de courier si están disponibles
        if self.courier:
            self.costo_kilo_aereo_usd_fijo = self.courier.tarifa_aerea_usd_kg
            self.costo_kilo_maritimo_usd_fijo = self.courier.tarifa_maritima_usd_kg
        else:
            # Usar tarifas por defecto de configuración
            self.costo_kilo_aereo_usd_fijo = config.costo_kilo_aereo_usd
            self.costo_kilo_maritimo_usd_fijo = config.costo_kilo_maritimo_usd

        self.fecha_tasa_fija = timezone.now()
        self.save(update_fields=[
            'tipo_cambio_usd_fijo', 'tipo_cambio_brl_fijo',
            'tipo_cambio_cny_fijo', 'tipo_cambio_ars_fijo',
            'costo_kilo_aereo_usd_fijo', 'costo_kilo_maritimo_usd_fijo',
            'fecha_tasa_fija'
        ])

    def __str__(self):
        ref = self.nombre_referencia or f"Lote #{self.id}"
        return f"{ref} - {self.get_tipo_envio_display()} ({self.get_estado_display()})"


class ItemLote(models.Model):
    """Relación entre Producto y LoteImportacion con información específica del ítem en el lote"""
    MONEDA_CHOICES = [
        ('USD', 'Dólares (USD $)'),
        ('BRL', 'Reales (BRL R$)'),
        ('CNY', 'Yuanes (CNY ¥)'),
        ('ARS', 'Pesos Argentinos (ARS $)'),
        ('PYG', 'Guaraníes (PYG Gs.)'),
    ]

    producto = models.ForeignKey(
        'Producto',
        on_delete=models.CASCADE,
        verbose_name="Producto"
    )
    lote = models.ForeignKey(
        'LoteImportacion',
        on_delete=models.CASCADE,
        verbose_name="Lote de Importación"
    )
    cantidad = models.PositiveIntegerField(
        default=1,
        verbose_name="Cantidad de este producto en el lote"
    )
    # Opcional: costo específico de este ítem en el lote (si difiere del cálculo estándar)
    costo_unitario_pyg = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Costo Unitario en Lote (PYG Gs.)",
        help_text="Si se especifica, se usa este costo en lugar de calcularlo"
    )

    # ===== CAMPOS DE HISTORIAL DE COSTOS =====
    costo_moneda_origen_historico = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True, blank=True,
        verbose_name="Costo FOB Histórico",
        help_text="Costo en moneda de compra usado en este lote"
    )
    moneda_compra_historica = models.CharField(
        max_length=3,
        choices=MONEDA_CHOICES,
        default='USD',
        blank=True,
        verbose_name="Moneda de Compra",
        help_text="Moneda usada en este lote: USD, BRL, CNY, ARS"
    )
    # Un solo tipo de cambio: el de la moneda con la que se compró este ítem
    tipo_cambio_historico = models.IntegerField(
        null=True, blank=True,
        verbose_name="Tipo de Cambio Histórico (Gs.)",
        help_text="Cotización en Guaraníes de la moneda de compra al momento del lote (ej: 5913 si compró en USD)"
    )
    costo_flete_por_gramo_historico = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True, blank=True,
        verbose_name="Flete por Gramo Histórico",
        help_text="Costo de flete por gramo del lote al momento de asociación"
    )
    # Costo final calculado y guardado como snapshot
    costo_pyg_historico = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True, blank=True,
        verbose_name="Costo Final PYG Histórico",
        help_text="Costo final en guaraníes calculado para este ítem en este lote"
    )

    proveedor_historico = models.ForeignKey(
        ProveedorReal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Proveedor/Tienda",
        help_text="Tienda específica desde donde se compró este producto en este lote"
    )

    class Meta:
        verbose_name = "Item en Lote"
        verbose_name_plural = "Items en Lotes"
        unique_together = ('producto', 'lote')

    def __str__(self):
        return f"{self.producto.nombre} en {self.lote.nombre_referencia or f'Lote #{self.lote.id}'} (Cantidad: {self.cantidad})"

    @property
    def costo_unitario_final(self):
        """Retorna el costo unitario a usar (el especificado o el calculado)"""
        if self.costo_unitario_pyg:
            return self.costo_unitario_pyg
        # Si tenemos snapshot histórico, lo usamos directamente
        if self.costo_pyg_historico:
            return int(self.costo_pyg_historico)
        return self.producto.calcular_costo_landed_for_lote(self.lote)


class Producto(models.Model):
    CATEGORIAS = [
        ('AR', 'Aros / Aretes'),
        ('CO', 'Collares'),
        ('CA', 'Cadenas'),
        ('PU', 'Pulseras y Brazaletes'),
        ('AN', 'Anillos'),
        ('ST', 'Sets / Parejas'),
        ('LE', 'Lentes / Gafas'),
        ('TO', 'Tobilleras'),
        ('DI', 'Dijes / Colgantes'),
        ('PQ', 'Paquetería / Packaging'),
        ('OT', 'Otros Accesorios'),
    ]

    GENEROS = [
        ('M', 'Caballero'),
        ('F', 'Dama'),
        ('U', 'Unisex'),
    ]

    MONEDA_CHOICES = [
        ('USD', 'Dólares (USD $)'),
        ('BRL', 'Reales (BRL R$)'),
        ('CNY', 'Yuanes (CNY ¥)'),
        ('ARS', 'Pesos Argentinos (ARS $)'),
        ('PYG', 'Guaraníes (PYG Gs.)'),
    ]

    nombre = models.CharField(
        max_length=150,
        verbose_name="Nombre del Modelo / Accesorio",
        help_text="Ej: Pulsera Cuero Trenzado con Broche Acero, Anillo Sello Vikingo, etc."
    )
    categoria = models.CharField(max_length=2, choices=CATEGORIAS, default='OT', verbose_name="Categoría")
    genero = models.CharField(max_length=1, choices=GENEROS, default='U', verbose_name="Público / Género")

    # Materiales (Soporta combinaciones múltiples: ej. Cuero PU + Acero Quirúrgico)
    materiales = models.ManyToManyField(
        Material,
        blank=True,
        related_name="productos",
        verbose_name="Material(es)",
        help_text="Puedes seleccionar uno o varios materiales combinados"
    )

    plataforma = models.ForeignKey(
        Plataforma,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Plataforma",
        help_text="Shein, Alibaba, AliExpress, Amazon, etc."
    )
    proveedor_real = models.ForeignKey(
        'ProveedorReal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Proveedor / Vendedor",
        help_text="Vendedor específico o tienda (ej: yiwustore en Alibaba, tienda directa en Brasil, etc.)"
    )
    # Nota: La relación con LoteImportacion ahora se maneja através de ItemLote (ManyToMany)
    # El campo lote directo ha sido reemplazado por la relación muchos-a-muchos

    url_producto = models.TextField(
        blank=True,
        null=True,
        verbose_name="Enlace de Compra",
        help_text="URL original de Shein/AliExpress/Alibaba"
    )
    imagen_url = models.TextField(blank=True, null=True, verbose_name="URL de Imagen Externa")
    imagen_archivo = models.ImageField(upload_to='productos/', blank=True, null=True, verbose_name="Subir Foto")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción / Cuidados de la pieza")

    # Costo en Origen y Peso
    costo_moneda_origen = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name="Costo en Origen (FOB)",
        help_text="Precio pagado en la moneda original (ej: 2.50 USD o 15 BRL)"
    )
    moneda_compra = models.CharField(
        max_length=3,
        choices=MONEDA_CHOICES,
        default='USD',
        verbose_name="Moneda de Compra"
    )
    peso_gramos = models.IntegerField(
        default=15,
        verbose_name="Peso Estimado (Gramos)",
        help_text="Peso aproximado de la pieza en gramos para costear el flete"
    )

    # Costo Puesto en Paraguay y Precio de Venta
    costo_pyg = models.IntegerField(
        default=0,
        verbose_name="Costo Final Unitario (PYG Gs.)",
        help_text="Costo real puesto en Paraguay (Compra + Flete prorrateado)"
    )
    precio_venta = models.IntegerField(
        default=0,
        verbose_name="Precio de Venta al Público (PYG Gs.)",
        help_text="Precio sugerido de venta en Guaraníes (Para aros: precio del par)"
    )
    precio_unidad = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Precio por Unidad (Opcional - Aros/Individual)",
        help_text="Si se deja vacío para Aros, se calcula automáticamente según la escala estándar."
    )
    activo = models.BooleanField(default=True, verbose_name="Activo en Catálogo")
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Producto (Modelo Base)"
        verbose_name_plural = "Productos (Modelos Base)"
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_display()} - {self.get_genero_display()})"

    @property
    def stock_total(self):
        return sum(v.stock for v in self.variantes.all())

    @property
    def precio_unidad_calculado(self):
        """Devuelve el precio unitario exacto o calculado según la escala si es categoría Aros (AR)"""
        if self.precio_unidad and self.precio_unidad > 0:
            return self.precio_unidad
        if self.categoria == 'AR' and self.precio_venta:
            pv = self.precio_venta
            if pv <= 20000:
                return 15000
            elif pv <= 30000:
                return 20000
            elif pv <= 40000:
                return 25000
            elif pv <= 50000:
                return 30000
            elif pv <= 60000:
                return 35000
            else:
                return int(round((pv / 2.0 + 5000) / 5000.0) * 5000)
        return self.precio_venta

    @property
    def ganancia_estimada_unitaria(self):
        if self.precio_venta and self.costo_pyg:
            return self.precio_venta - self.costo_pyg
        return 0

    @property
    def margen_porcentaje(self):
        """Margen de Venta (Profit Margin %): (Precio - Costo) / Precio * 100"""
        if self.precio_venta and self.precio_venta > 0 and self.costo_pyg:
            return round(((self.precio_venta - self.costo_pyg) / self.precio_venta) * 100, 1)
        return 0.0

    def calcular_costo_landed(self):
        """Calcula el costo final en PYG según la cotización y el flete real/estimado"""
        # If the instance hasn't been saved yet, we cannot access the ManyToMany relation.
        if not self.pk:
            return self._calcular_costo_landed_sin_lote()

        # Usa el lote más reciente por defecto para compatibilidad hacia atrás
        lote_reciente = self.lotes.order_by('-fecha_creacion').first()
        if lote_reciente:
            return self.calcular_costo_landed_for_lote(lote_reciente)
        return self._calcular_costo_landed_sin_lote()

    def calcular_costo_landed_for_lote(self, lote):
        """Calcula el costo final en PYG para un lote específico"""
        if not self.costo_moneda_origen:
            return self.costo_pyg

        # Usar tasas de cambio fijas del lote si están disponibles, sino usar las actuales
        if lote.fecha_tasa_fija and lote.tipo_cambio_usd_fijo is not None:
            tc_map = {
                'USD': lote.tipo_cambio_usd_fijo,
                'BRL': lote.tipo_cambio_brl_fijo,
                'CNY': lote.tipo_cambio_cny_fijo,
                'ARS': lote.tipo_cambio_ars_fijo,
                'PYG': 1
            }
            # Para las tarifas de courier, también usar tasas fijas si están disponibles
            if lote.courier:
                tarifa_kilo_usd = lote.courier.tarifa_aerea_usd_kg
                if lote.tipo_envio == 'MAR':
                    tarifa_kilo_usd = lote.courier.tarifa_maritima_usd_kg
                tarifa_kilo_pyg = float(tarifa_kilo_usd) * lote.tipo_cambio_usd_fijo
            else:
                # Fallback a configuración general si no hay courier
                config = Configuracion.get_config()
                tarifa_kilo_usd = config.costo_kilo_aereo_usd
                if lote and lote.tipo_envio == 'MAR':
                    tarifa_kilo_usd = config.costo_kilo_maritimo_usd
                tarifa_kilo_pyg = float(tarifa_kilo_usd) * lote.tipo_cambio_usd_fijo
        else:
            # Fallback a tasas actuales (compatibilidad hacia atrás)
            config = Configuracion.get_config()
            tc_map = {
                'USD': config.tipo_cambio_usd,
                'BRL': config.tipo_cambio_brl,
                'CNY': config.tipo_cambio_cny,
                'ARS': config.tipo_cambio_ars,
                'PYG': 1
            }
            # Usar tarifas de courier actuales
            if lote.courier:
                tarifa_kilo_usd = lote.courier.tarifa_aerea_usd_kg
                if lote.tipo_envio == 'MAR':
                    tarifa_kilo_usd = lote.courier.tarifa_maritima_usd_kg
            else:
                tarifa_kilo_usd = config.costo_kilo_aereo_usd
                if lote and lote.tipo_envio == 'MAR':
                    tarifa_kilo_usd = config.costo_kilo_maritimo_usd
            tarifa_kilo_pyg = float(tarifa_kilo_usd) * config.tipo_cambio_usd

        tc = tc_map.get(self.moneda_compra, tc_map['USD'])
        costo_base_pyg = float(self.costo_moneda_origen) * tc

        # Flete: Prorrateado del lote especificado o fallback con tarifa de courier configurada
        if lote and lote.costo_flete_por_gramo > 0:
            flete_pyg = self.peso_gramos * lote.costo_flete_por_gramo
        else:
            flete_pyg = (self.peso_gramos / 1000.0) * tarifa_kilo_pyg

        return int(round(costo_base_pyg + flete_pyg))

    def _calcular_costo_landed_sin_lote(self):
        """Calcula costo cuando no hay lote asociado (usa tarifas por defecto)"""
        if not self.costo_moneda_origen:
            return self.costo_pyg

        config = Configuracion.get_config()
        tc_map = {
            'USD': config.tipo_cambio_usd,
            'BRL': config.tipo_cambio_brl,
            'CNY': config.tipo_cambio_cny,
            'ARS': config.tipo_cambio_ars,
            'PYG': 1
        }
        tc = tc_map.get(self.moneda_compra, config.tipo_cambio_usd)
        costo_base_pyg = float(self.costo_moneda_origen) * tc

        # Flete usando tarifa por defecto
        tarifa_kilo_usd = config.costo_kilo_aereo_usd
        tarifa_kilo_pyg = float(tarifa_kilo_usd) * config.tipo_cambio_usd
        flete_pyg = (self.peso_gramos / 1000.0) * tarifa_kilo_pyg

        return int(round(costo_base_pyg + flete_pyg))

    def save(self, *args, **kwargs):
        if self.costo_moneda_origen:
            self.costo_pyg = self.calcular_costo_landed()

        # Si no tiene precio de venta asignado, sugiere automáticamente según el margen configurado
        if (not self.precio_venta or self.precio_venta == 0) and self.costo_pyg > 0:
            config = Configuracion.get_config()
            factor_margen = 1 + (config.margen_sugerido_porcentaje / 100.0)
            precio_calculado = self.costo_pyg * factor_margen
            # Redondeo comercial amigable a múltiplos de 5.000 Gs.
            self.precio_venta = int(round(precio_calculado / 5000.0) * 5000)

        super().save(*args, **kwargs)


class ProductoImagen(models.Model):
    """Fotos adicionales para la galería de un producto."""
    producto = models.ForeignKey(
        Producto,
        related_name='imagenes_galeria',
        on_delete=models.CASCADE,
        verbose_name="Producto"
    )
    imagen_url = models.TextField(blank=True, null=True, verbose_name="URL de Imagen Externa")
    imagen_archivo = models.ImageField(upload_to='productos/galeria/', blank=True, null=True, verbose_name="Subir Foto")
    orden = models.PositiveIntegerField(default=0, verbose_name="Orden")
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Foto de Galería"
        verbose_name_plural = "Fotos de Galería"
        ordering = ['orden', 'id']

    @property
    def url_completa(self):
        if self.imagen_archivo:
            try:
                url = self.imagen_archivo.url
                if url.startswith('http://') or url.startswith('https://'):
                    return url
                return url
            except Exception:
                pass
        return self.imagen_url or None

    def __str__(self):
        return f"Foto #{self.id} de {self.producto.nombre}"


class VarianteProducto(models.Model):
    """Variante específica por Color, Talle o Medida"""
    PREFIXES_CATEGORIA = {
        'AR': 'ARO',
        'CO': 'CAD',
        'PU': 'PUL',
        'AN': 'ANI',
        'TO': 'TOB',
        'DI': 'DIJ',
        'OT': 'ACC',
    }

    producto = models.ForeignKey(
        Producto,
        related_name='variantes',
        on_delete=models.CASCADE,
        verbose_name="Producto Base"
    )
    color = models.CharField(
        max_length=100,
        default='Único',
        help_text="Ej: Dorado, Plateado, Negro, Oro Rosa, Café, Cuero Negro o combinaciones de marco y lente"
    )
    talle_medida = models.CharField(
        max_length=50,
        default='Ajustable',
        help_text="Ej: Talle 7, Talle 8, Talle 9, 50cm, 60cm, Ajustable"
    )
    sku = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
        verbose_name="SKU / Código Único (Auto-generado)"
    )
    stock = models.PositiveIntegerField(
        default=1,
        verbose_name="Stock Disponible"
    )
    precio_venta = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Precio de Venta Específico (Gs.)",
        help_text="Opcional: Si se deja vacío, hereda automáticamente el precio_venta del producto padre"
    )
    codigo_barras = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Código de Barras (Opcional)"
    )
    imagen_url = models.TextField(
        blank=True,
        null=True,
        verbose_name="Imagen de esta variante (URL)",
        help_text="URL de imagen específica para este color/talle. Si está vacío se usa la imagen del producto base."
    )
    imagen_archivo = models.ImageField(
        upload_to='variantes/',
        blank=True,
        null=True,
        verbose_name="Foto propia de esta variante"
    )
    activo = models.BooleanField(default=True, verbose_name="Activo")

    @property
    def precio_efectivo(self):
        """Devuelve el precio propio si existe; caso contrario, hereda el del producto"""
        if self.precio_venta is not None and self.precio_venta > 0:
            return self.precio_venta
        return self.producto.precio_venta or 0

    class Meta:
        verbose_name = "Variante de Accesorio (Color / Talle)"
        verbose_name_plural = "Variantes de Accesorios (Color / Talle)"
        ordering = ['producto', 'color', 'talle_medida']

    def __str__(self):
        return f"{self.producto.nombre} | Color: {self.color} - Talle: {self.talle_medida} (Stock: {self.stock})"

    def generar_sku_inteligente(self):
        """Genera un SKU estructurado: CAT-GEN-MOD-COL-TAL (ej: PUL-M-CUTR-NEG-20)"""
        prefijo_cat = self.PREFIXES_CATEGORIA.get(self.producto.categoria, 'ACC')
        prefijo_gen = self.producto.genero  # 'M', 'F', 'U'

        # Código del nombre (primeras letras significativas)
        palabras_ignorar = {'de', 'del', 'la', 'los', 'las', 'un', 'una', 'con', 'para', 'y', 'en', 'acero'}
        palabras = [p for p in re.findall(r'\b[a-zA-Z]+\b', self.producto.nombre) if p.lower() not in palabras_ignorar]
        cod_nombre = "".join([p[:2].upper() for p in palabras[:2]]) if palabras else "MOD"

        # Código de color y talle
        cod_color = self.color[:3].upper() if self.color else "UNI"
        cod_talle = "".join(re.findall(r'\d+', self.talle_medida)) or (self.talle_medida[:3].upper() if self.talle_medida else "AJU")

        sku_base = f"{prefijo_cat}-{prefijo_gen}-{cod_nombre}-{cod_color}-{cod_talle}"

        # Si ya existiera, le agrega un hash aleatorio
        if VarianteProducto.objects.filter(sku=sku_base).exclude(pk=self.pk).exists():
            sku_base = f"{sku_base}-{uuid.uuid4().hex[:3].upper()}"

        return sku_base

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = self.generar_sku_inteligente()
        super().save(*args, **kwargs)


class Cliente(models.Model):
    nombre = models.CharField(
        max_length=120,
        verbose_name="Nombre Completo"
    )
    telefono = models.CharField(
        max_length=40,
        blank=True,
        null=True,
        verbose_name="Teléfono / WhatsApp",
        help_text="Ej: 0981123456 o +595981123456"
    )
    instagram = models.CharField(
        max_length=80,
        blank=True,
        null=True,
        verbose_name="Instagram",
        help_text="Ej: @usuario o usuario"
    )
    ciudad = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Ciudad / Localidad"
    )
    direccion = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Dirección de Entrega"
    )
    notas = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notas / Observaciones"
    )
    fecha_registro = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Registro"
    )
    activo = models.BooleanField(
        default=True,
        verbose_name="Activo"
    )

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.telefono or 'Sin tel'})"

    @property
    def total_compras(self):
        return self.ventas.count()

    @property
    def total_gastado(self):
        return sum(v.total_cobrado for v in self.ventas.all())

    @property
    def es_recurrente(self):
        return self.total_compras > 1

    @property
    def ultima_compra(self):
        ultima = self.ventas.order_by('-fecha_venta').first()
        return ultima.fecha_venta if ultima else None


class Venta(models.Model):
    METODOS_PAGO = [
        ('EF', '💵 Efectivo'),
        ('GT', '📱 Giros Tigo / Billetera Móvil'),
        ('TR', '🏦 Transferencia Bancaria (SIPAP)'),
        ('QRD', '📲 Pago QR (Débito)'),
        ('QRC', '📲 Pago QR (Crédito)'),
        ('TD', '💳 Tarjeta de Débito (POS)'),
        ('TC', '💳 Tarjeta de Crédito (POS)'),
    ]

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ventas',
        verbose_name="Cliente Registrado"
    )
    fecha_venta = models.DateTimeField(default=timezone.now, verbose_name="Fecha y Hora")
    metodo_pago = models.CharField(
        max_length=4,
        choices=METODOS_PAGO,
        default='QRD',
        verbose_name="Método de Pago"
    )
    total_cobrado = models.IntegerField(default=0, verbose_name="Total Cobrado (Gs.)")
    cliente_nombre = models.CharField(max_length=120, blank=True, null=True, verbose_name="Cliente (Opcional)")
    cliente_telefono = models.CharField(max_length=40, blank=True, null=True, verbose_name="Teléfono / WhatsApp")
    notas = models.TextField(blank=True, null=True, verbose_name="Notas de la Venta")

    class Meta:
        verbose_name = "Venta / Pedido"
        verbose_name_plural = "Ventas / Pedidos"
        ordering = ['-fecha_venta']

    def __str__(self):
        return f"Venta #{self.id} - Gs. {self.total_cobrado_format} ({self.get_metodo_pago_display()})"

    @property
    def costo_total_pedido(self):
        return sum(item.costo_subtotal for item in self.detalles.all())

    @property
    def ganancia_real(self):
        return (self.total_cobrado or 0) - self.costo_total_pedido

    @property
    def total_cobrado_format(self):
        return f"{int(self.total_cobrado):,}".replace(",", ".")

    @property
    def ganancia_real_format(self):
        return f"{int(self.ganancia_real):,}".replace(",", ".")

    def calcular_total_automatico(self):
        self.total_cobrado = sum(item.subtotal for item in self.detalles.all())
        self.save()

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            # Forzamos la llamada al delete individual de cada item para devolver el stock
            for item in self.detalles.all():
                item.delete()
            super().delete(*args, **kwargs)


class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, related_name='detalles', on_delete=models.CASCADE)
    variante = models.ForeignKey(
        VarianteProducto,
        on_delete=models.PROTECT,
        verbose_name="Accesorio (Variante / Talle)"
    )
    # Para tracking preciso de costos, podríamos agregar qué lote específico vino esta variante
    # Pero por ahora asumimos que el costo está en la variante/producto
    cantidad = models.PositiveIntegerField(default=1, verbose_name="Cantidad")
    precio_unitario = models.IntegerField(blank=True, null=True, verbose_name="Precio Unitario (Gs.)")

    class Meta:
        verbose_name = "Ítem Vendido"
        verbose_name_plural = "Ítems Vendidos"

    @property
    def subtotal(self):
        precio = self.precio_unitario or (self.variante.producto.precio_venta if self.variante else 0)
        return precio * self.cantidad

    @property
    def costo_subtotal(self):
        costo = self.variante.producto.costo_pyg if self.variante else 0
        return costo * self.cantidad

    def clean(self):
        super().clean()
        if self.variante and self.cantidad:
            cantidad_previa = 0
            if self.pk:
                original = DetalleVenta.objects.get(pk=self.pk)
                cantidad_previa = original.cantidad

            diferencia = self.cantidad - cantidad_previa
            if diferencia > self.variante.stock:
                raise ValidationError({
                    'cantidad': f'¡Stock insuficiente para "{self.variante}"! '
                                f'Stock disponible: {self.variante.stock}'
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.precio_unitario and self.variante:
            self.precio_unitario = self.variante.producto.precio_venta or 0

        with transaction.atomic():
            if not self.pk:
                VarianteProducto.objects.filter(pk=self.variante.pk).update(
                    stock=models.F('stock') - self.cantidad
                )
            else:
                original = DetalleVenta.objects.get(pk=self.pk)
                diferencia = self.cantidad - original.cantidad
                if diferencia != 0:
                    VarianteProducto.objects.filter(pk=self.variante.pk).update(
                        stock=models.F('stock') - diferencia
                    )
            super().save(*args, **kwargs)

        if self.venta and self.venta.total_cobrado == 0:
            self.venta.calcular_total_automatico()

    def delete(self, *args, **kwargs):
        if self.variante:
            VarianteProducto.objects.filter(pk=self.variante.pk).update(
                stock=models.F('stock') + self.cantidad
            )
        super().delete(*args, **kwargs)


class Gasto(models.Model):
    CATEGORIAS = [
        ('ADS', '📢 Publicidad y Meta Ads (Instagram/Facebook/TikTok)'),
        ('EMP', '📦 Packaging y Empaque (Bolsas, cajas, cintas, tarjetas)'),
        ('ENV', '🛵 Delivery y Envíos Locales / Interior'),
        ('POS', '💳 Comisiones POS / Bancarias'),
        ('INS', '💎 Insumos de Tienda (Exhibidores, medidores, limpiadores)'),
        ('VAR', '📋 Otros Gastos Operativos'),
    ]

    fecha = models.DateField(default=timezone.localdate, verbose_name="Fecha del Gasto")
    categoria = models.CharField(
        max_length=3,
        choices=CATEGORIAS,
        default='ADS',
        verbose_name="Categoría de Gasto"
    )
    monto_pyg = models.IntegerField(verbose_name="Monto en Guaraníes (Gs.)")
    descripcion = models.CharField(
        max_length=255,
        verbose_name="Descripción / Proveedor",
        help_text="Ej: Campaña Instagram 5 días, 200 bolsitas de pana personalizadas, etc."
    )
    comprobante = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nro. Factura / Recibo")

    class Meta:
        verbose_name = "Gasto Operativo"
        verbose_name_plural = "Gastos Operativos"
        ordering = ['-fecha', '-id']

    def __str__(self):
        return f"{self.get_categoria_display()} - Gs. {int(self.monto_pyg):,}".replace(",", ".")


class Configuracion(models.Model):
    """Singleton: Configuraciones globales de cotizaciones y tarifas"""
    tipo_cambio_usd = models.IntegerField(default=7500, verbose_name="Tipo de Cambio USD → PYG (Gs.)")
    tipo_cambio_brl = models.IntegerField(default=1400, verbose_name="Tipo de Cambio BRL → PYG (Gs.)")
    tipo_cambio_cny = models.IntegerField(default=1050, verbose_name="Tipo de Cambio CNY → PYG (Gs.)")
    tipo_cambio_ars = models.IntegerField(default=8, verbose_name="Tipo de Cambio ARS → PYG (Gs.)")

    costo_kilo_aereo_usd = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=22.50,
        verbose_name="Tarifa Courier Aéreo Default (USD/kg)"
    )
    costo_kilo_maritimo_usd = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=9.50,
        verbose_name="Tarifa Courier Marítimo Default (USD/kg)"
    )
    margen_sugerido_porcentaje = models.IntegerField(
        default=60,
        verbose_name="Margen de Ganancia Sugerido (%)",
        help_text="Porcentaje de ganancia sobre el precio de venta (ej: 60%)"
    )
    # Metas Financieras Mensuales & Punto de Equilibrio
    meta_deuda_mensual_pyg = models.IntegerField(
        default=1332000,
        verbose_name="Cuota de Deudas Mensual (Gs.)",
        help_text="Monto mensual a cubrir por deudas u obligaciones fijas"
    )
    meta_ads_mensual_pyg = models.IntegerField(
        default=800000,
        verbose_name="Presupuesto Meta Ads Mensual (Gs.)",
        help_text="Presupuesto mensual asignado a publicidad en Meta Ads / Redes"
    )
    meta_sueldo_libre_pyg = models.IntegerField(
        default=800000,
        verbose_name="Ganancia Libre Deseada Mensual (Gs.)",
        help_text="Meta de dinero libre en tu bolsillo tras cubrir deudas y publicidad"
    )
    ultima_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")

    class Meta:
        verbose_name = "Configuración Global"
        verbose_name_plural = "Configuración Global"

    def __str__(self):
        return f"Configuración Global (USD: {self.tipo_cambio_usd} Gs. | Tarifa Courier: ${self.costo_kilo_aereo_usd})"

    @classmethod
    def get_config(cls):
        config, _ = cls.objects.get_or_create(pk=1)
        return config


# ─────────────────────────────────────────────────────────────────────────────
# PEDIDOS WEB — Órdenes recibidas desde la tienda online por WhatsApp
# ─────────────────────────────────────────────────────────────────────────────

class PedidoWeb(models.Model):
    ESTADOS = [
        ('PENDIENTE',  '⏳ Pendiente de confirmación'),
        ('CONFIRMADO', '✅ Pago confirmado — Venta registrada'),
        ('CANCELADO',  '❌ Cancelado'),
    ]

    TIPOS_ENVIO = [
        ('villarrica', '🛵 Delivery Villarrica / Alrededores'),
        ('interior',   '📦 Envío por Transportadora'),
    ]

    METODOS_PAGO = [
        ('contimovil', 'ContiMóvil / QR'),
        ('billetera',  'Billetera Tigo'),
        ('transferencia', 'Transferencia Bancaria'),
        ('otro', 'Otro'),
    ]

    estado = models.CharField(
        max_length=12, choices=ESTADOS, default='PENDIENTE', verbose_name='Estado'
    )
    fecha_pedido = models.DateTimeField(default=timezone.now, verbose_name='Fecha del Pedido')
    fecha_confirmacion = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Confirmación')

    # Datos del cliente
    cliente_nombre = models.CharField(max_length=120, verbose_name='Nombre del Cliente')
    cliente_telefono = models.CharField(max_length=40, blank=True, null=True, verbose_name='Teléfono / WhatsApp')
    cliente_ci = models.CharField(max_length=20, blank=True, null=True, verbose_name='CI')
    cliente_ciudad = models.CharField(max_length=100, blank=True, null=True, verbose_name='Ciudad')
    cliente_direccion = models.TextField(blank=True, null=True, verbose_name='Dirección / Sucursal Transportadora')

    # Logística
    tipo_envio = models.CharField(max_length=12, choices=TIPOS_ENVIO, default='villarrica', verbose_name='Tipo de Envío')
    metodo_pago = models.CharField(max_length=15, choices=METODOS_PAGO, default='contimovil', verbose_name='Método de Pago')

    # Totales
    subtotal_productos = models.IntegerField(default=0, verbose_name='Subtotal Productos (Gs.)')
    costo_envio = models.IntegerField(default=0, verbose_name='Costo de Envío (Gs.)')
    total_pedido = models.IntegerField(default=0, verbose_name='Total del Pedido (Gs.)')

    # Venta generada al confirmar
    venta = models.OneToOneField(
        Venta, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='pedido_web', verbose_name='Venta Generada'
    )

    notas = models.TextField(blank=True, null=True, verbose_name='Notas / Mensaje del Cliente')

    class Meta:
        verbose_name = 'Pedido Web (WhatsApp)'
        verbose_name_plural = 'Pedidos Web (WhatsApp)'
        ordering = ['-fecha_pedido']

    def __str__(self):
        return f'Pedido #{self.id} — {self.cliente_nombre} ({self.get_estado_display()})'

    def confirmar(self, metodo_pago_venta='TR'):
        """
        Confirma el pedido: crea una Venta con sus DetalleVenta,
        lo que descuenta el stock automáticamente via el save() de DetalleVenta.
        """
        if self.estado != 'PENDIENTE':
            raise ValidationError('Solo se pueden confirmar pedidos en estado PENDIENTE.')

        with transaction.atomic():
            venta = Venta.objects.create(
                cliente_nombre=self.cliente_nombre,
                cliente_telefono=self.cliente_telefono or '',
                metodo_pago=metodo_pago_venta,
                total_cobrado=self.total_pedido,
                notas=f'Pedido Web #{self.id} — {self.get_tipo_envio_display()}',
            )
            for detalle in self.detalles.select_related('variante'):
                DetalleVenta.objects.create(
                    venta=venta,
                    variante=detalle.variante,
                    cantidad=detalle.cantidad,
                    precio_unitario=detalle.precio_unitario,
                )
            self.venta = venta
            self.estado = 'CONFIRMADO'
            self.fecha_confirmacion = timezone.now()
            self.save()

        return venta

    def cancelar(self):
        if self.estado != 'PENDIENTE':
            raise ValidationError('Solo se pueden cancelar pedidos en estado PENDIENTE.')
        self.estado = 'CANCELADO'
        self.save()


class DetallePedidoWeb(models.Model):
    pedido = models.ForeignKey(
        PedidoWeb, related_name='detalles', on_delete=models.CASCADE
    )
    variante = models.ForeignKey(
        VarianteProducto, on_delete=models.PROTECT,
        verbose_name='Variante del Producto'
    )
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.IntegerField(verbose_name='Precio Unitario (Gs.)')
    nombre_producto = models.CharField(max_length=200, blank=True, verbose_name='Nombre (snapshot)')
    grabado_texto = models.TextField(blank=True, null=True, verbose_name='Grabado / Personalización')

    class Meta:
        verbose_name = 'Ítem del Pedido Web'
        verbose_name_plural = 'Ítems del Pedido Web'

    @property
    def subtotal(self):
        return self.precio_unitario * self.cantidad

    def __str__(self):
        return f'{self.nombre_producto} x{self.cantidad}'
