import re
import uuid
from django.db import models, transaction
from django.utils import timezone
from django.core.exceptions import ValidationError


class Proveedor(models.Model):
    PAISES = [
        ('CN', 'China (Shein / AliExpress / Alibaba)'),
        ('BR', 'Brasil (Brás / São Paulo)'),
        ('AR', 'Argentina (Buenos Aires / Clorinda)'),
        ('US', 'Estados Unidos'),
        ('PY', 'Paraguay (Mayorista Local)'),
    ]

    nombre = models.CharField(
        max_length=80,
        help_text="Ej: Shein, AliExpress, Alibaba, Fornecedor Brás, etc."
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
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_pais_origen_display().split()[0]})"


class Courier(models.Model):
    TIPOS_SERVICIO = [
        ('AER', 'Aéreo EE.UU. / Miami (China - Casilla)'),
        ('MAR', 'Marítimo EE.UU. / Miami (China - Cargas Pesadas)'),
        ('TER', 'Terrestre Brasil (São Paulo / Foz)'),
        ('ARG', 'Transporte Argentina (BsAs / Clorinda)'),
        ('LOC', 'Delivery Local / Encomiendas PY'),
    ]

    nombre = models.CharField(
        max_length=100,
        help_text="Ej: Sendit, Flashbox, GlobalBox, Transportadora CDE, etc."
    )
    tipo_servicio = models.CharField(
        max_length=3,
        choices=TIPOS_SERVICIO,
        default='AER',
        verbose_name="Tipo de Servicio Principal"
    )
    tarifa_aerea_usd_kg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=22.50,
        verbose_name="Tarifa Aérea (USD/kg)"
    )
    tarifa_maritima_usd_kg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=9.50,
        verbose_name="Tarifa Marítima (USD/kg)"
    )
    tarifa_terrestre_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        verbose_name="Tarifa Terrestre por kg"
    )
    moneda_tarifa = models.CharField(
        max_length=3,
        choices=[('USD', 'USD'), ('BRL', 'BRL'), ('PYG', 'PYG'), ('ARS', 'ARS')],
        default='USD',
        verbose_name="Moneda de Cobro"
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
    proveedor_principal = models.ForeignKey(
        Proveedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Plataforma / Tienda Principal",
        help_text="Dejar vacío si es una caja consolidada con compras de varias tiendas"
    )
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

    def __str__(self):
        ref = self.nombre_referencia or f"Lote #{self.id}"
        return f"{ref} - {self.get_tipo_envio_display()} ({self.get_estado_display()})"


class ItemLote(models.Model):
    """Relación entre Producto y LoteImportacion con información específica del ítem en el lote"""
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
        return self.producto.calcular_costo_landed_for_lote(self.lote)


class Producto(models.Model):
    CATEGORIAS = [
        ('AR', 'Aros / Aretes'),
        ('CO', 'Collares y Cadenas'),
        ('PU', 'Pulseras y Brazaletes'),
        ('AN', 'Anillos'),
        ('TO', 'Tobilleras'),
        ('DI', 'Dijes / Colgantes'),
        ('OT', 'Otros Accesorios'),
    ]

    GENEROS = [
        ('M', 'Hombre / Masculino'),
        ('F', 'Dama / Femenino'),
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

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        verbose_name="Proveedor / Plataforma"
    )
    # Nota: La relación con LoteImportacion ahora se maneja através de ItemLote (ManyToMany)
    # El campo lote directo ha sido reemplazado por la relación muchos-a-muchos

    url_producto = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Enlace de Compra",
        help_text="URL original de Shein/AliExpress/Alibaba"
    )
    imagen_url = models.URLField(max_length=500, blank=True, null=True, verbose_name="URL de Imagen Externa")
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
        help_text="Precio sugerido de venta en Guaraníes"
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
    def ganancia_estimada_unitaria(self):
        if self.precio_venta and self.costo_pyg:
            return self.precio_venta - self.costo_pyg
        return 0

    @property
    def margen_porcentaje(self):
        if self.costo_pyg and self.costo_pyg > 0 and self.precio_venta:
            return round(((self.precio_venta - self.costo_pyg) / self.costo_pyg) * 100, 1)
        return 0

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

        # Flete: Prorrateado del lote especificado o fallback con tarifa de courier configurada
        if lote and lote.costo_flete_por_gramo > 0:
            flete_pyg = self.peso_gramos * lote.costo_flete_por_gramo
        else:
            tarifa_kilo_usd = config.costo_kilo_aereo_usd
            if lote and lote.tipo_envio == 'MAR':
                tarifa_kilo_usd = config.costo_kilo_maritimo_usd
            tarifa_kilo_pyg = float(tarifa_kilo_usd) * config.tipo_cambio_usd
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
        max_length=50,
        default='Único',
        help_text="Ej: Dorado, Plateado, Negro, Oro Rosa, Café, Cuero Negro"
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
    codigo_barras = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Código de Barras (Opcional)"
    )
    activo = models.BooleanField(default=True, verbose_name="Activo")

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

    fecha = models.DateField(default=timezone.now, verbose_name="Fecha del Gasto")
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
        default=70,
        verbose_name="Margen de Ganancia Sugerido (%)",
        help_text="Porcentaje de ganancia sobre el costo final (ej: 70%)"
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