from django.core.management.base import BaseCommand
from tienda.models import LoteImportacion, Producto, Configuracion

class Command(BaseCommand):
    help = 'Verify that the LoteImportacion no longer has proveedor_real and that fixed costs work'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Verifying LoteImportacion model...'))

        # Check that LoteImportacion no longer has proveedor_real field
        lote_fields = [f.name for f in LoteImportacion._meta.get_fields()]
        if 'proveedor_real' in lote_fields:
            self.stdout.write(self.style.ERROR('ERROR: LoteImportacion still has proveedor_real field'))
        else:
            self.stdout.write(self.style.SUCCESS('OK: LoteImportacion does not have proveedor_real field'))

        # Check that it still has plataforma
        if 'plataforma' in lote_fields:
            self.stdout.write(self.style.SUCCESS('OK: LoteImportacion still has plataforma field'))
        else:
            self.stdout.write(self.style.ERROR('ERROR: LoteImportacion missing plataforma field'))

        # Get a lot from the database (should exist from seed_data)
        try:
            lote = LoteImportacion.objects.first()
        except LoteImportacion.DoesNotExist:
            self.stdout.write(self.style.WARNING('WARNING: No lotes found in database'))
            lote = None

        if lote:
            self.stdout.write(f'\n--- Lote: {lote.nombre_referencia} ---')
            self.stdout.write(f'Plataforma: {lote.plataforma.nombre if lote.plataforma else "None"}')

            # Get first product's proveedor safely
            first_producto = lote.productos.first()
            if first_producto and first_producto.proveedor_real:
                proveedor_nombre = first_producto.proveedor_real.nombre
            else:
                proveedor_nombre = "None"
            self.stdout.write(f'Proveedor (via producto): {proveedor_nombre}')

            # Check if fixed rates are saved
            if lote.fecha_tasa_fija:
                self.stdout.write(self.style.SUCCESS(f'OK: Fixed rates saved: USD={lote.tipo_cambio_usd_fijo}'))
            else:
                self.stdout.write(self.style.WARNING('WARNING: No fixed rates saved yet (lot not confirmed)'))

            # Test cost calculation for a product in this lot
            if lote.productos.exists():
                producto = lote.productos.first()
                self.stdout.write(f'\n--- Producto: {producto.nombre} ---')
                self.stdout.write(f'Costo moneda origen: {producto.costo_moneda_origen} {producto.moneda_compra}')

                # Calculate cost using the lot's fixed rates (if available) or current rates
                costo_calculado = producto.calcular_costo_landed_for_lote(lote)
                self.stdout.write(f'Costo calculado para este lote: {costo_calculado:,} Gs'.replace(',', '.'))

                # Simulate changing global exchange rate
                config = Configuracion.get_config()
                original_usd = config.tipo_cambio_usd
                config.tipo_cambio_usd = 6900  # Simulate a drastic change
                config.save()

                # Recalculate with new global rate (should not affect if fixed rates exist)
                costo_nuevo = producto.calcular_costo_landed_for_lote(lote)
                config.tipo_cambio_usd = original_usd  # Restore
                config.save()

                if lote.fecha_tasa_fija:
                    if costo_calculado == costo_nuevo:
                        self.stdout.write(self.style.SUCCESS('SUCCESS: Cost did not change when global rate changed (using fixed rates)'))
                    else:
                        self.stdout.write(self.style.ERROR(f'ERROR: Cost changed from {costo_calculado} to {costo_nuevo} when it should have been fixed'))
                else:
                    self.stdout.write(self.style.WARNING('WARNING: Lot has no fixed rates, so cost may change with global rate (expected for unconfirmed lot)'))
            else:
                self.stdout.write(self.style.WARNING('WARNING: No products associated with this lot'))
        else:
            self.stdout.write(self.style.WARNING('WARNING: Could not test cost calculation because no lot found'))

        self.stdout.write(self.style.SUCCESS('\nVerification completed.'))