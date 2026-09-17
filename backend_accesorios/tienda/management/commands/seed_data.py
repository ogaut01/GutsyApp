from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from tienda.models import (
    Configuracion, Plataforma, ProveedorReal, Courier, Material,
    LoteImportacion, Producto, VarianteProducto, Venta, DetalleVenta, Gasto, ItemLote
)

class Command(BaseCommand):
    help = 'Puebla la base de datos con configuración inicial, couriers, proveedores, materiales y datos de prueba'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Iniciando carga de datos iniciales..."))

        # 1. Configuración Global
        config = Configuracion.get_config()
        config.tipo_cambio_usd = 7500
        config.tipo_cambio_brl = 1400
        config.tipo_cambio_cny = 1050
        config.tipo_cambio_ars = 8
        config.costo_kilo_aereo_usd = 22.50
        config.costo_kilo_maritimo_usd = 9.50
        config.margen_sugerido_porcentaje = 70
        config.save()
        self.stdout.write(self.style.SUCCESS("[OK] Configuracion Global establecida (USD 7.500 Gs | Courier $22.50)"))

        # 2. Superusuario Administrador
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@accesorios.py', 'admin123')
            self.stdout.write(self.style.SUCCESS("[OK] Superusuario creado: admin / admin123"))

        # 3. Materiales
        materiales = [
            ("Acero Quirurgico / Inoxidable 316L", "Resistente al agua, no se oxida ni cambia de color"),
            ("Cuero PU / Trenzado", "Cuero sintetico de alta resistencia"),
            ("Plata 925 / Esterlina", "Joyeria fina en plata"),
            ("Oro Laminado / Bano 18K", "Bano de oro de alta durabilidad"),
            ("Piedras Naturales / Circonias", "Piedras volcanicas, ojo de tigre y circonias"),
            ("Titanio / Tungsteno", "Metales pesados de alta durabilidad"),
            ("Cordon Nautico / Silicona", "Materiales para pulseras deportivas y casuales"),
        ]
        mat_objs = {}
        for nombre, desc in materiales:
            obj, _ = Material.objects.get_or_create(nombre=nombre, defaults={'descripcion': desc})
            mat_objs[nombre] = obj
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(materiales)} Materiales creados"))

        # 4. Plataformas (necesarias para ProveedorReal)
        plataformas_data = [
            ("Shein", "CN", "USD"),
            ("AliExpress", "CN", "USD"),
            ("Alibaba", "CN", "USD"),
            ("Fornecedor Bras (Sao Paulo)", "BR", "BRL"),
            ("Mayorista Joyas Once (Buenos Aires)", "AR", "ARS"),
        ]
        plataformas_objs = {}
        for nombre, pais, moneda in plataformas_data:
            obj, _ = Plataforma.objects.get_or_create(
                nombre=nombre,
                defaults={'pais_origen': pais, 'moneda_defecto': moneda, 'activo': True}
            )
            plataformas_objs[nombre] = obj
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(plataformas_data)} Plataformas creadas"))

        # 4. Proveedores (ahora ProveedorReal)
        proveedores = [
            ("Shein", "Shein Oficial", "CN", "USD", "https://shein.com"),
            ("AliExpress", "AliExpress Store", "CN", "USD", "https://aliexpress.com"),
            ("Alibaba", "Alibaba Supplier", "CN", "USD", "https://alibaba.com"),
            ("Fornecedor Bras (Sao Paulo)", "Bras Import", "BR", "BRL", "+55 11 99999-0000"),
            ("Mayorista Joyas Once (Buenos Aires)", "Joyas Once Import", "AR", "ARS", "+54 11 88888-0000"),
        ]
        prov_objs = {}
        for plataforma_nombre, nombre, pais, moneda, contacto in proveedores:
            plataforma = plataformas_objs[plataforma_nombre]
            obj, _ = ProveedorReal.objects.get_or_create(
                nombre=nombre,
                plataforma=plataforma,
                defaults={
                    'contacto': contacto,
                    'calificacion_calidad': 4,  # Valor por defecto
                    'activo': True
                }
            )
            prov_objs[nombre] = obj  # Usar el nombre del proveedor como clave
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(proveedores)} Proveedores creados"))

        # 5. Couriers
        couriers = [
            ("Sendit Courier", "AER", 22.50, 9.50, 0, "USD", "Asuncion - WhatsApp: 0981-123456"),
            ("Flashbox Casilla", "AER", 22.50, 9.00, 0, "USD", "Miami / Asuncion"),
            ("Transportadora Foz do Iguacu", "TER", 0, 0, 15000, "PYG", "Llegadas semanales a CDE/Asuncion"),
            ("Encomiendas Clorinda / BsAs", "ARG", 0, 0, 20000, "PYG", "Transporte directo terrestre"),
        ]
        courier_objs = {}
        for nombre, tipo, aereo, mar, ter, moneda, contacto in couriers:
            obj, _ = Courier.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'tipo_servicio': tipo,
                    'tarifa_aerea_usd_kg': aereo,
                    'tarifa_maritima_usd_kg': mar,
                    'tarifa_terrestre_kg': ter,
                    'moneda_tarifa': moneda,
                    'contacto': contacto
                }
            )
            courier_objs[nombre] = obj
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(couriers)} Couriers registrados"))

        # 6. Lote de Ejemplo (Caja Miami Aérea)
        lote, creado = LoteImportacion.objects.get_or_create(
            nombre_referencia="Caja Shein & Ali - Agosto 2026",
            defaults={
                'courier': courier_objs["Sendit Courier"],
                'plataforma': plataformas_objs["Shein"],
                'tipo_envio': 'AER',
                'estado': 'EN_COURIER_PY',
                'tracking_origen': 'TBA123456789000',
                'tracking_courier': 'SND-PY-88920',
                'peso_total_gramos': 2400, # 2.4 kg
                'costo_flete_total_pyg': 405000, # 2.4kg * $22.50 = $54 * 7.500 Gs = 405.000 Gs (Gs. 168.75 por gramo)
                'otros_gastos_lote_pyg': 0,
                'notas': 'Lote con 30 collares, pulseras y anillos.'
            }
        )
        # Guardar tasas de cambio fijas si es un lote nuevo
        if creado:
            lote.guardar_tasas_fijas()
            self.stdout.write(self.style.SUCCESS(f"[OK] Tasas de cambio fijas guardadas para el lote: USD={lote.tipo_cambio_usd_fijo}"))
        self.stdout.write(self.style.SUCCESS(f"[OK] Lote de prueba creado con flete prorrateado a Gs. {lote.costo_flete_por_gramo:.1f}/gramo"))

        # 7. Productos y Variantes de Prueba
        # Producto 1: Pulsera Cuero PU + Acero
        prod1, _ = Producto.objects.get_or_create(
            nombre="Pulsera Cuero Trenzado con Broche Magnetico Acero",
            defaults={
                'categoria': 'PU',
                'genero': 'M',
                'proveedor_real': prov_objs["AliExpress Store"],
                'plataforma': prov_objs["AliExpress Store"].plataforma,
                'costo_moneda_origen': 2.80, # $2.80 USD
                'moneda_compra': 'USD',
                'peso_gramos': 25, # 25g -> Flete: 25 * 168.75 = 4.218 Gs. Costo FOB: 2.80 * 7500 = 21.000 Gs. Total: ~25.218 Gs
                'precio_venta': 55000,
            }
        )
        prod1.materiales.set([mat_objs["Acero Quirurgico / Inoxidable 316L"], mat_objs["Cuero PU / Trenzado"]])
        prod1.save()
        # Asociar con el lote a través de ItemLote
        ItemLote.objects.get_or_create(producto=prod1, lote=lote, defaults={'cantidad': 1})

        # Variantes de Prod 1
        VarianteProducto.objects.get_or_create(
            producto=prod1, color="Negro", talle_medida="20cm",
            defaults={'stock': 4}
        )
        VarianteProducto.objects.get_or_create(
            producto=prod1, color="Negro", talle_medida="22cm",
            defaults={'stock': 3}
        )
        VarianteProducto.objects.get_or_create(
            producto=prod1, color="Cafe Oscuro", talle_medida="20cm",
            defaults={'stock': 2}
        )

        # Producto 2: Anillo Sello Vikingo
        prod2, _ = Producto.objects.get_or_create(
            nombre="Anillo Sello Acero Quirurgico 316L",
            defaults={
                'categoria': 'AN',
                'genero': 'M',
                'proveedor_real': prov_objs["Alibaba Supplier"],
                'plataforma': prov_objs["Alibaba Supplier"].plataforma,
                'costo_moneda_origen': 1.90, # $1.90 USD
                'moneda_compra': 'USD',
                'peso_gramos': 18,
                'precio_venta': 45000,
            }
        )
        prod2.materiales.set([mat_objs["Acero Quirurgico / Inoxidable 316L"]])
        prod2.save()
        # Asociar con el lote a través de ItemLote
        ItemLote.objects.get_or_create(producto=prod2, lote=lote, defaults={'cantidad': 1})

        # Variantes de Anillo (Dorado y Negro en varios talles)
        for talle, stock in [("Talle 7", 3), ("Talle 8", 3), ("Talle 9", 3), ("Talle 10", 3)]:
            VarianteProducto.objects.get_or_create(
                producto=prod2, color="Dorado", talle_medida=talle,
                defaults={'stock': stock}
            )
        for talle, stock in [("Talle 8", 2), ("Talle 10", 1)]:
            VarianteProducto.objects.get_or_create(
                producto=prod2, color="Negro", talle_medida=talle,
                defaults={'stock': stock}
            )

        # Producto 3: Cadena Cubana Dama (Oro Laminado)
        prod3, _ = Producto.objects.get_or_create(
            nombre="Cadena Eslabon Cubano Fino 45cm",
            defaults={
                'categoria': 'CO',
                'genero': 'F',
                'proveedor_real': prov_objs["Shein Oficial"],
                'plataforma': prov_objs["Shein Oficial"].plataforma,
                'costo_moneda_origen': 3.20,
                'moneda_compra': 'USD',
                'peso_gramos': 20,
                'precio_venta': 60000,
            }
        )
        prod3.materiales.set([mat_objs["Oro Laminado / Bano 18K"], mat_objs["Acero Quirurgico / Inoxidable 316L"]])
        prod3.save()
        # Asociar con el lote a través de ItemLote
        ItemLote.objects.get_or_create(producto=prod3, lote=lote, defaults={'cantidad': 1})

        VarianteProducto.objects.get_or_create(
            producto=prod3, color="Dorado", talle_medida="45cm",
            defaults={'stock': 5}
        )
        VarianteProducto.objects.get_or_create(
            producto=prod3, color="Plateado", talle_medida="45cm",
            defaults={'stock': 3}
        )

        self.stdout.write(self.style.SUCCESS("[OK] Productos y variantes de prueba cargados con SKUs inteligentes"))

        # 8. Gastos Operativos de Ejemplo (Meta Ads y Packaging)
        Gasto.objects.get_or_create(
            descripcion="Pauta Meta Ads Instagram - Campana Accesorios Hombre (4 dias)",
            defaults={'categoria': 'ADS', 'monto_pyg': 120000}
        )
        Gasto.objects.get_or_create(
            descripcion="100 Bolsitas de Pana Terciopelo con Logo + Tarjetas",
            defaults={'categoria': 'EMP', 'monto_pyg': 250000}
        )
        self.stdout.write(self.style.SUCCESS("[OK] Gastos operativos de prueba registrados"))

        # 9. Venta de Prueba
        var_anillo = VarianteProducto.objects.filter(producto=prod2, color="Dorado", talle_medida="Talle 8").first()
        var_pulsera = VarianteProducto.objects.filter(producto=prod1, color="Negro", talle_medida="20cm").first()

        if var_anillo and var_pulsera:
            venta, creada = Venta.objects.get_or_create(
                cliente_nombre="Carlos Benitez",
                defaults={
                    'metodo_pago': 'QRD', # QR Débito
                    'total_cobrado': 100000,
                    'cliente_telefono': '0981-999888',
                    'notas': 'Cliente contacto por Instagram, retiro en Asuncion.'
                }
            )
            if creada:
                DetalleVenta.objects.create(
                    venta=venta,
                    variante=var_anillo,
                    cantidad=1,
                    precio_unitario=45000
                )
                DetalleVenta.objects.create(
                    venta=venta,
                    variante=var_pulsera,
                    cantidad=1,
                    precio_unitario=55000
                )
                venta.calcular_total_automatico()
                self.stdout.write(self.style.SUCCESS(f"[OK] Venta de prueba #{venta.id} registrada con QR Debito por Gs. {venta.total_cobrado_format}"))

        self.stdout.write(self.style.SUCCESS("\n[EXITO] Base de datos inicializada y verificada con exito!"))
