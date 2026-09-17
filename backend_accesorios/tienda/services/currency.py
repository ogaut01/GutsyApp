import json
import requests
from tienda.models import Configuracion
from django.utils import timezone

def sincronizar_cotizaciones_en_bd():
    """
    Obtiene las cotizaciones diarias desde el repositorio oficial
    sistemasaguila/cotizaciones-set (fuente: DNIT - Paraguay)
    y actualiza el registro en la base de datos
    """
    try:
        # URL directa al último JSON de cotizaciones oficiales de DNIT
        url = "https://cdn.jsdelivr.net/gh/sistemasaguila/cotizaciones-set/data/latest.json"

        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Lanza excepción para códigos de error HTTP

        data = response.json()

        # Extraer los datos de la fecha más reciente (la clave es la fecha en formato YYYY-MM-DD)
        # El JSON tiene estructura: {"2026-08-25": {"usd": {"purchase": ..., "sale": ...}, ...}}
        fecha_mas_reciente = max(data.keys())  # Obtiene la fecha más reciente
        datos_dia = data[fecha_mas_reciente]

        # Usamos el precio de venta (sale) como referencia, que es lo que pagarías al comprar
        # Puedes cambiar a 'purchase' si prefieres el precio de compra
        tasas = {
            'USD': int(round(datos_dia.get('usd', {}).get('sale', 5990))),
            'BRL': int(round(datos_dia.get('brl', {}).get('sale', 1160))),
            'CNY': int(round(datos_dia.get('cny', {}).get('sale', 1050))),  # Si no tiene CNY, usar valor por defecto
            'ARS': int(round(datos_dia.get('ars', {}).get('sale', 8))),    # Si no tiene ARS, usar valor por defecto
        }

        # Actualizar la configuración en la base de datos
        config = Configuracion.get_config()
        config.tipo_cambio_usd = tasas['USD']
        config.tipo_cambio_brl = tasas['BRL']
        config.tipo_cambio_cny = tasas['CNY']
        config.tipo_cambio_ars = tasas['ARS']
        config.ultima_actualizacion = timezone.now()
        config.save()

        return tasas

    except Exception as e:
        # En caso de fallo en la fuente principal, intentar con una fuente de respaldo
        try:
            # Fuente de respaldo: melizeche/dolarPy (API alternativa)
            respaldo_url = "https://open.er-api.com/v6/latest/USD"
            respaldo_req = requests.get(respaldo_url, timeout=10)
            respaldo_req.raise_for_status()
            respaldo_data = respaldo_req.json()

            rates = respaldo_data.get('rates', {})
            usd_pyg = rates.get('PYG')

            if not usd_pyg:
                raise Exception("No se encontró PYG en la API de respaldo")

            # Calcular otras monedas basándonos en USD
            usd_brl = rates.get('BRL')
            usd_cny = rates.get('CNY')
            usd_ars = rates.get('ARS')

            brl_pyg = (usd_pyg / usd_brl) if usd_brl else 1400
            cny_pyg = (usd_pyg / usd_cny) if usd_cny else 1050
            ars_pyg = (usd_pyg / usd_ars) if usd_ars else 8

            tasas = {
                'USD': int(round(usd_pyg)),
                'BRL': int(round(brl_pyg)),
                'CNY': int(round(cny_pyg)),
                'ARS': int(round(ars_pyg)),
            }

            # Actualizar con los datos de respaldo
            config = Configuracion.get_config()
            config.tipo_cambio_usd = tasas['USD']
            config.tipo_cambio_brl = tasas['BRL']
            config.tipo_cambio_cny = tasas['CNY']
            config.tipo_cambio_ars = tasas['ARS']
            config.ultima_actualizacion = timezone.now()
            config.save()

            # Registrar que se usó fuente de respaldo (en un sistema de logging real)
            # Por ahora, simplemente continuamos
            return tasas

        except Exception as e2:
            # Si ambas fuentes fallan, devolver las últimas tasas conocidas
            # Esto evita que el sistema se rompa completamente
            config = Configuracion.get_config()
            return {
                'USD': config.tipo_cambio_usd,
                'BRL': config.tipo_cambio_brl,
                'CNY': config.tipo_cambio_cny,
                'ARS': config.tipo_cambio_ars,
            }