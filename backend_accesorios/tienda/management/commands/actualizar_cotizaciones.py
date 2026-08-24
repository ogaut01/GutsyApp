from django.core.management.base import BaseCommand
from tienda.services.currency import sincronizar_cotizaciones_en_bd

class Command(BaseCommand):
    help = 'Actualiza las cotizaciones globales (USD, BRL, CNY, ARS) consultando la API en tiempo real'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Consultando API de divisas..."))
        try:
            tasas = sincronizar_cotizaciones_en_bd()
            self.stdout.write(self.style.SUCCESS(
                f"[OK] Cotizaciones actualizadas exitosamente:\n"
                f"  - 1 USD = Gs. {tasas['USD']:,}\n"
                f"  - 1 BRL = Gs. {tasas['BRL']:,}\n"
                f"  - 1 CNY = Gs. {tasas['CNY']:,}\n"
                f"  - 1 ARS = Gs. {tasas['ARS']:,}"
            ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] No se pudo actualizar: {str(e)}"))
