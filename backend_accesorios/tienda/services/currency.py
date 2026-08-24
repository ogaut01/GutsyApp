import json
import urllib.request
from tienda.models import Configuracion

def obtener_cotizaciones_api():
    """
    Consulta una API pública y gratuita de tipos de cambio (sin necesidad de API Key)
    y calcula el valor de USD, BRL, CNY y ARS en Guaraníes (PYG).
    """
    url = "https://open.er-api.com/v6/latest/USD"
    
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AccesoriosPY/1.0'}
    )
    
    with urllib.request.urlopen(req, timeout=10) as response:
        if response.status != 200:
            raise Exception(f"Error al conectar con la API de divisas (Status: {response.status})")
        
        data = json.loads(response.read().decode('utf-8'))
        
    rates = data.get('rates', {})
    
    usd_pyg = rates.get('PYG')
    usd_brl = rates.get('BRL')
    usd_cny = rates.get('CNY')
    usd_ars = rates.get('ARS')
    
    if not usd_pyg:
        raise Exception("No se encontró la cotización del Guaraní (PYG) en la respuesta de la API.")
    
    # 1 USD = usd_pyg Guaraníes
    # 1 BRL = (usd_pyg / usd_brl) Guaraníes
    # 1 CNY = (usd_pyg / usd_cny) Guaraníes
    # 1 ARS = (usd_pyg / usd_ars) Guaraníes
    
    brl_pyg = (usd_pyg / usd_brl) if usd_brl else 1400
    cny_pyg = (usd_pyg / usd_cny) if usd_cny else 1050
    ars_pyg = (usd_pyg / usd_ars) if usd_ars else 8
    
    return {
        'USD': int(round(usd_pyg)),
        'BRL': int(round(brl_pyg)),
        'CNY': int(round(cny_pyg)),
        'ARS': int(round(ars_pyg)),
    }

def sincronizar_cotizaciones_en_bd():
    """Obtiene las cotizaciones de la API y actualiza el registro en la base de datos"""
    cotizaciones = obtener_cotizaciones_api()
    config = Configuracion.get_config()
    
    config.tipo_cambio_usd = cotizaciones['USD']
    config.tipo_cambio_brl = cotizaciones['BRL']
    config.tipo_cambio_cny = cotizaciones['CNY']
    config.tipo_cambio_ars = cotizaciones['ARS']
    config.save()
    
    return cotizaciones
