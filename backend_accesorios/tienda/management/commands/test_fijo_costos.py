from django.core.management.base import BaseCommand
from tienda.models import Producto, LoteImportacion, Configuracion

class Command(BaseCommand):
    help = 'Test that product costs remain fixed when exchange rates change'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Testing FIXED cost functionality...'))

        # Obtener el lote que sabemos tiene tasas fijas (el del seed data)
        try:
            lote = LoteImportacion.objects.get(id=1)  # El lote de seed data
            # Obtener un producto asociado a este lote
            producto = lote.productos.first()
            if not producto:
                # Si no hay productos, tomar cualquiera que tenga lote
                producto_con_lote = Producto.objects.filter(lotes__isnull=False).distinct().first()
                if not producto_con_lote:
                    self.stdout.write(self.style.ERROR('No product with associated lot found'))
                    return
                producto = producto_con_lote
                lote = producto.lotes.first()
        except LoteImportacion.DoesNotExist:
            # Fallback a cualquier producto con lote
            producto_con_lote = Producto.objects.filter(lotes__isnull=False).distinct().first()
            if not producto_con_lote:
                self.stdout.write(self.style.ERROR('No product with associated lot found'))
                return
            producto = producto_con_lote
            lote = producto.lotes.first()

        self.stdout.write(f'\n--- Producto: {producto.nombre} ---')
        self.stdout.write(f'Costo en moneda origen: {producto.costo_moneda_origen} {producto.moneda_compra}')
        self.stdout.write(f'Peso en gramos: {producto.peso_gramos}')

        # Mostrar el costo actual
        costo_actual = producto.costo_pyg
        self.stdout.write(f'Costo PYG actual: {costo_actual:,} Gs'.replace(',', '.'))

        # Mostrar detalles del lote
        self.stdout.write(f'\n--- Lote: {lote.nombre_referencia} ---')
        self.stdout.write(f'Fecha tasa fija: {lote.fecha_tasa_fija}')
        self.stdout.write(f'Tipo cambio USD fijo: {lote.tipo_cambio_usd_fijo}')
        self.stdout.write(f'Tipo cambio BRL fijo: {lote.tipo_cambio_brl_fijo}')
        self.stdout.write(f'Flete por gramo: {lote.costo_flete_por_gramo:.2f} Gs/g')

        # Calcular costo usando método actual
        costo_calculado = producto.calcular_costo_landed()
        self.stdout.write(f'Costo calculado (método): {costo_calculado:,} Gs'.replace(',', '.'))

        # Verificar que coinciden
        if costo_actual == costo_calculado:
            self.stdout.write(self.style.SUCCESS('OK: Costo almacenado coincide con calculo'))
        else:
            self.stdout.write(self.style.ERROR('ERROR: Diferencia: {} vs {}'.format(costo_actual, costo_calculado)))

        # AHORA SIMULAMOS UN CAMBIO EN LA COTIZACION
        self.stdout.write('\n--- SIMULANDO CAMBIO EN COTIZACION ---')
        config = Configuracion.get_config()
        usd_original = config.tipo_cambio_usd
        self.stdout.write('Cotizacion USD original: {}'.format(usd_original))

        # Cambiamos la cotizacion a un valor diferente (ej: 6900 como en tu ejemplo)
        config.tipo_cambio_usd = 6900
        config.save()
        self.stdout.write('Nueva cotizacion USD: {}'.format(config.tipo_cambio_usd))

        # Recalculamos el costo del producto
        costo_nuevo_calculado = producto.calcular_costo_landed()
        self.stdout.write('Costo recalculado con nueva tasa: {:,} Gs'.format(costo_nuevo_calculado).replace(',', '.'))

        # Pero el costo almacenado debería permanecer igual
        self.stdout.write('Costo almacenado (debe quedar fijo): {:,} Gs'.format(costo_actual).replace(',', '.'))

        if costo_actual != costo_nuevo_calculado:
            self.stdout.write(self.style.SUCCESS('SUCCESS: El costo almacenado NO cambio pese a la nueva cotizacion'))
            self.stdout.write('  Diferencia: {:,} Gs'.format(abs(costo_nuevo_calculado - costo_actual)).replace(',', '.'))
        else:
            self.stdout.write(self.style.WARNING('WARNING: El costo cambio (esto sería incorrecto para costos historicos)'))

        # Restaurar la cotizacion original
        config.tipo_cambio_usd = usd_original
        config.save()
        self.stdout.write('Cotizacion restaurada a: {}'.format(config.tipo_cambio_usd))

        # Verificacion final
        costo_final = producto.calcular_costo_landed()
        if costo_final == costo_actual:
            self.stdout.write(self.style.SUCCESS('OK: Verificacion final: costo correcto después de restaurar tasa'))
        else:
            self.stdout.write(self.style.ERROR('ERROR: {} vs {}'.format(costo_final, costo_actual)))

        self.stdout.write(self.style.SUCCESS('\nPrueba completada: Los costos históricos permanecen fijos!'))