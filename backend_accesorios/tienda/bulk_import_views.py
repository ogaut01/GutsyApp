import json
import csv
import io
import re
import logging
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Producto, VarianteProducto, ProveedorReal as Proveedor, Material, Configuracion, Plataforma
from openpyxl import Workbook, load_workbook
from openpyxl.worksheet.datavalidation import DataValidation


logger = logging.getLogger(__name__)

def clean_url(u):
    if not u or not isinstance(u, str):
        return None
    u = u.strip()
    if u.upper() in ('NO TIENE', 'VACIO', 'NONE', 'NULL', '-', ''):
        return None
    if u.startswith('//'):
        u = 'https:' + u
    if u.startswith(('http://', 'https://')):
        return u
    return None

@api_view(['POST'])
def carga_masiva_productos_api(request):
    """
    Recibe una lista de productos con sus variantes para validar e insertar
    en una sola transacción atómica.
    """
    items = request.data.get('productos', [])
    if not items or not isinstance(items, list):
        return Response({'error': 'Se requiere una lista de productos válida'}, status=status.HTTP_400_BAD_REQUEST)

    creados = 0
    variantes_creadas = 0
    errores = []
    producto_ids = []

    # Todos los proveedores creados por esta carga pertenecen a una plataforma
    # conocida. Se resuelve una vez para no repetir consultas por cada fila.
    default_platform = Plataforma.objects.filter(nombre='Shein').first() or Plataforma.objects.first()
    if not default_platform:
        return Response({
            'error': 'No hay plataformas configuradas. Ejecutá primero la configuración inicial del sistema.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            for index, item in enumerate(items):
                nombre = item.get('nombre', '').strip()
                if not nombre:
                    errores.append(f"Fila {index + 1}: El nombre del producto es obligatorio.")
                    continue

                categoria = item.get('categoria', 'OT').upper()
                genero = item.get('genero', 'U').upper()
                proveedor_nombre = item.get('proveedor', 'Shein').strip()
            
                # La unicidad del proveedor es por plataforma + nombre. Filtrar por
                # ambos campos evita errores 500 si existe el mismo nombre en otra plataforma.
                proveedor, _ = Proveedor.objects.get_or_create(
                    plataforma=default_platform,
                    nombre=proveedor_nombre,
                )

                costo_origen = item.get('costo_moneda_origen')
                moneda = item.get('moneda_compra', 'USD')
                peso = int(item.get('peso_gramos', 15) or 15)
                precio_venta = int(item.get('precio_venta', 0) or 0)

                url_origen = clean_url(item.get('url_origen'))
                url_imagen = clean_url(item.get('url_imagen'))

                # El nombre de Producto no es único en la base histórica. Reutilizamos
                # el registro más antiguo para que la carga no falle por coincidencias.
                producto = Producto.objects.filter(nombre=nombre).order_by('id').first()
                fue_creado = producto is None
                if fue_creado:
                    producto = Producto.objects.create(
                        nombre=nombre,
                        categoria=categoria if categoria in dict(Producto.CATEGORIAS) else 'OT',
                        genero=genero if genero in dict(Producto.GENEROS) else 'U',
                        proveedor_real=proveedor,
                        costo_moneda_origen=costo_origen,
                        moneda_compra=moneda,
                        peso_gramos=peso,
                        precio_venta=precio_venta,
                        url_producto=url_origen,
                        imagen_url=url_imagen,
                    )
                else:
                    if proveedor and not producto.proveedor_real:
                        producto.proveedor_real = proveedor
                    if url_origen and not producto.url_producto:
                        producto.url_producto = url_origen
                    if url_imagen and not producto.imagen_url:
                        producto.imagen_url = url_imagen
                    producto.save()
                if fue_creado:
                    creados += 1
                producto_ids.append(producto.id)

                # Materiales (opcional)
                material_nombres = item.get('materiales', [])
                if isinstance(material_nombres, str):
                    material_nombres = [m.strip() for m in material_nombres.split(',') if m.strip()]
                for mat_nom in material_nombres:
                    mat_obj, _ = Material.objects.get_or_create(nombre=mat_nom)
                    producto.materiales.add(mat_obj)

                # Variantes (Color, Talle, Stock)
                variantes_data = item.get('variantes', [])
                if not variantes_data:
                    color = item.get('color', 'Único')
                    talle = item.get('talle_medida', 'Ajustable')
                    stock = int(item.get('stock', 1) or 1)
                    variantes_data = [{'color': color, 'talle_medida': talle, 'stock': stock}]

                for v in variantes_data:
                    color_v = v.get('color', 'Único') or 'Único'
                    talle_v = v.get('talle_medida', 'Ajustable') or 'Ajustable'
                    stock_v = int(v.get('stock', 0) or 0)
                    imagen_v = v.get('imagen_url') or None

                    var_obj, var_creada = VarianteProducto.objects.get_or_create(
                        producto=producto,
                        color=color_v,
                        talle_medida=talle_v,
                        defaults={'stock': stock_v, 'imagen_url': imagen_v}
                    )
                    if not var_creada:
                        var_obj.stock += stock_v
                        # Update imagen_url only if the variant doesn't have one yet
                        if imagen_v and not var_obj.imagen_url:
                            var_obj.imagen_url = imagen_v
                        var_obj.save()
                    variantes_creadas += 1
    except Exception as exc:
        logger.exception('Error inesperado durante la carga masiva de productos')
        return Response({
            'error': 'No se pudo completar la importación. No se guardó ningún cambio.',
            'detalle': str(exc),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if errores:
        return Response({'status': 'error', 'errores': errores}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'status': 'success',
        'message': f'¡Carga masiva completada exitosamente! Se registraron {creados} modelos y {variantes_creadas} variantes de stock.',
        'productos_creados': creados,
        'variantes_creadas': variantes_creadas,
        'producto_ids': producto_ids,
    })

@api_view(['GET'])
def descargar_plantilla_excel(request):
    """
    Genera y devuelve un archivo Excel (.xlsx) con validaciones de datos (desplegables)
    que estira los proveedores actuales de la base de datos y incluye filas de ejemplo
    basadas en productos existentes.
    """
    wb = Workbook()

    # Hoja 1: Productos
    ws_prod = wb.active
    ws_prod.title = "Productos"

    headers = [
        "nombre_modelo", "categoria", "genero", "proveedor", "color",
        "talle_medida", "stock", "costo_moneda_origen", "moneda_compra",
        "peso_gramos", "precio_venta", "materiales", "url_origen", "url_imagen"
    ]
    ws_prod.append(headers)

    # Obtener algunos productos de ejemplo de la base de datos (máximo 5)
    productos_ejemplo = Producto.objects.select_related('proveedor_real').prefetch_related(
        'variantes', 'materiales'
    )[:5]

    if productos_ejemplo:
        for producto in productos_ejemplo:
            # Obtener primera variante si existe
            variante = producto.variantes.first()
            color = variante.color if variante else 'Único'
            talle = variante.talle_medida if variante else 'Ajustable'
            stock = variante.stock if variante else 0

            # Materiales como cadena separada por comas
            materiales = ', '.join([m.nombre for m in producto.materiales.all()])

            ws_prod.append([
                producto.nombre,
                producto.categoria,
                producto.genero,
                producto.proveedor_real.nombre if producto.proveedor_real else '',
                color,
                talle,
                stock,
                producto.costo_moneda_origen or '',
                producto.moneda_compra,
                producto.peso_gramos,
                producto.precio_venta,
                materiales,
                producto.url_producto or '',
                producto.imagen_url or ""
            ])
    else:
        # Si no hay productos en la base de datos, agregar una fila de ejemplo genérica
        ws_prod.append([
            "Anillo Sello Acero Quirurgico 316L", "AN", "M", "Alibaba", "Dorado", "Talle 8", 3, 1.90, "USD", 18, 45000, "Acero Quirurgico", "https://www.aliexpress.com/item/ejemplo", "https://ejemplo.com/imagen-producto.jpg"
        ])

    # Hoja 2: Listas (Opciones desplegables)
    ws_listas = wb.create_sheet(title="Listas")

    # Cargar Categorias
    cats = ['AN', 'CA', 'CO', 'PU', 'AR', 'ST', 'LE', 'TO', 'DI', 'RE', 'PI', 'OT']
    for idx, c in enumerate(cats, start=1):
        ws_listas.cell(row=idx, column=1, value=c)

    # Cargar Generos
    gens = ['M', 'F', 'U']
    for idx, g in enumerate(gens, start=1):
        ws_listas.cell(row=idx, column=2, value=g)

    # Cargar Monedas
    currs = ['USD', 'BRL', 'CNY', 'ARS', 'PYG']
    for idx, c in enumerate(currs, start=1):
        ws_listas.cell(row=idx, column=3, value=c)

    # Cargar Proveedores desde BD
    provs = list(Proveedor.objects.filter(activo=True).values_list('nombre', flat=True))
    if not provs:
        provs = ['Alibaba', 'AliExpress', 'Shein']
    for idx, p in enumerate(provs, start=1):
        ws_listas.cell(row=idx, column=4, value=p)

    # Crear Validaciones
    dv_cat = DataValidation(type="list", formula1=f"Listas!$A$1:$A${len(cats)}", allow_blank=True)
    dv_gen = DataValidation(type="list", formula1=f"Listas!$B$1:$B${len(gens)}", allow_blank=True)
    dv_mon = DataValidation(type="list", formula1=f"Listas!$C$1:$C${len(currs)}", allow_blank=True)
    dv_prov = DataValidation(type="list", formula1=f"Listas!$D$1:$D${len(provs)}", allow_blank=True)

    # Aplicar rangos (hasta fila 500)
    dv_cat.add("B2:B500")
    dv_gen.add("C2:C500")
    dv_prov.add("D2:D500")
    dv_mon.add("I2:I500")

    ws_prod.add_data_validation(dv_cat)
    ws_prod.add_data_validation(dv_gen)
    ws_prod.add_data_validation(dv_prov)
    ws_prod.add_data_validation(dv_mon)

    # Ocultar hoja de listas
    ws_listas.sheet_state = 'hidden'

    # Ajustar anchos
    for col in ws_prod.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = col[0].column_letter
        ws_prod.column_dimensions[col_letter].width = max(max_len + 3, 12)

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = "attachment; filename=plantilla_productos_accesorios.xlsx"
    wb.save(response)
    return response

import re

@api_view(['POST'])
def parsear_archivo_carga_masiva(request):
    """
    Recibe un archivo (CSV o XLSX) vía form-data, lo parsea y valida completamente
    del lado del servidor, devolviendo los resultados de validación para confirmación
    en el frontend sin modificar la base de datos.
    """
    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response({'error': 'No se cargó ningún archivo'}, status=status.HTTP_400_BAD_REQUEST)

    filename = file_obj.name.lower()
    rows = []

    try:
        if filename.endswith('.xlsx'):
            wb = load_workbook(file_obj, data_only=True)
            ws = wb.active
            for row in ws.iter_rows(values_only=True):
                if any(cell is not None for cell in row):
                    rows.append([str(c).strip() if c is not None else '' for c in row])
        elif filename.endswith('.csv'):
            file_data = file_obj.read().decode('utf-8-sig')
            separator = ';' if ';' in file_data.split('\n')[0] else ','
            reader = csv.reader(io.StringIO(file_data), delimiter=separator)
            for row in reader:
                rows.append([c.strip() for c in row])
        else:
            return Response({'error': 'Formato no soportado. Usá archivo .xlsx (Excel) o .csv'},
                          status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Error al leer archivo: {str(e)}'},
                      status=status.HTTP_400_BAD_REQUEST)

    if len(rows) < 2:
        return Response({'error': 'El archivo no contiene filas de datos'},
                      status=status.HTTP_400_BAD_REQUEST)

    # Normalize headers to lowercase for matching
    headers = [h.lower().strip() for h in rows[0]]

    # Check for required column
    if 'nombre_modelo' not in headers:
        return Response({'error': 'Falta la columna obligatoria "nombre_modelo" en el encabezado'},
                      status=status.HTTP_400_BAD_REQUEST)

    # Get indices for all expected columns
    expected_columns = [
        'nombre_modelo', 'categoria', 'genero', 'proveedor', 'color',
        'talle_medida', 'stock', 'costo_moneda_origen', 'moneda_compra',
        'peso_gramos', 'precio_venta', 'materiales', 'url_origen', 'url_imagen'
    ]

    column_indices = {}
    for col in expected_columns:
        if col in headers:
            column_indices[col] = headers.index(col)
        else:
            column_indices[col] = -1  # Column not present

    # Constants for validation
    from .models import Producto, ProveedorReal as Proveedor, Plataforma, Material
    categorias_validas = dict(Producto.CATEGORIAS)
    generos_validos = dict(Producto.GENEROS)
    monedas_validas = dict(Producto.MONEDA_CHOICES)

    # Pre-fetch existing providers and materials for validation (read-only)
    existing_providers = set(Proveedor.objects.filter(activo=True).values_list('nombre', flat=True))
    existing_materials = set(Material.objects.values_list('nombre', flat=True))
    existing_platforms = set(Plataforma.objects.values_list('nombre', flat=True))

    # Default platform for new providers (if needed)
    default_platform = Plataforma.objects.filter(nombre='Shein').first()
    if not default_platform:
        default_platform = Plataforma.objects.first()

    grouped = {}  # Keyed by product name
    errors = []   # List of validation errors
    warnings = [] # List of warnings (non-blocking issues)

    # Process each data row
    for row_idx, row in enumerate(rows[1:], start=2):  # start=2 because header is row 1
        # Skip completely empty rows
        if not any(cell.strip() for cell in row if cell):
            continue

        # Build row dictionary with available columns
        row_dict = {}
        for col in expected_columns:
            idx = column_indices[col]
            if idx != -1 and idx < len(row):
                row_dict[col] = row[idx]
            else:
                row_dict[col] = ''  # Missing column or empty

        nombre = row_dict.get('nombre_modelo', '').strip()
        if not nombre:
            # If all other major fields are empty, this is just a blank/ghost row in Excel. Skip silently!
            if not any(row_dict.get(k, '').strip() for k in ['proveedor', 'categoria', 'precio_venta', 'costo_moneda_origen', 'color', 'talle_medida']):
                continue
            errors.append(f"Fila {row_idx}: Nombre del modelo vacío.")
            continue

        # 3. proveedor (required)
        proveedor_nombre = row_dict.get('proveedor', '').strip() or 'Shein'
        if proveedor_nombre not in existing_providers:
            if not default_platform:
                errors.append(f"Fila {row_idx}: Proveedor '{proveedor_nombre}' no encontrado y no se puede crear porque no hay plataformas configuradas.")
            else:
                warnings.append(f"Fila {row_idx}: Proveedor '{proveedor_nombre}' no encontrado. Se creará automáticamente durante la importación (asociado a plataforma '{default_platform.nombre}').")

        # Create key for grouping: product_name
        product_key = nombre.strip()
        # Initialize product group if not exists
        if product_key not in grouped:
            grouped[product_key] = {
                'nombre': nombre,
                'proveedor': proveedor_nombre,
                'categoria': '',
                'genero': '',
                'costo_moneda_origen': None,
                'moneda_compra': '',
                'peso_gramos': None,
                'precio_venta': None,
                'descripcion': '',
                'materiales': [],
                'url_origen': '',
                'url_imagen': '',
                'variantes': [],
                'filas_origen': [],
                'validaciones': {
                    'costo_valido': False,
                    'peso_valido': False,
                    'precio_valido': False
                }
            }

        # Add this row to the product's rows
        grouped[product_key]['filas_origen'].append(row_idx)

        # 1. categoria (required) - with smart normalization
        cat_raw = row_dict.get('categoria', '').strip().upper()
        CAT_MAP = {
            'AN': 'AN', 'ANILLO': 'AN', 'ANILLOS': 'AN',
            'AR': 'AR', 'ARO': 'AR', 'AROS': 'AR', 'ARETE': 'AR', 'ARETES': 'AR',
            'CA': 'CA', 'CADENA': 'CA', 'CADENAS': 'CA',
            'CO': 'CO', 'COLLAR': 'CO', 'COLLARES': 'CO',
            'PU': 'PU', 'PULSERA': 'PU', 'PULSERAS': 'PU', 'BRAZALETE': 'PU', 'BRAZALETES': 'PU',
            'DI': 'DI', 'DIJE': 'DI', 'DIJES': 'DI', 'COLGANTE': 'DI', 'COLGANTES': 'DI',
            'ST': 'ST', 'SET': 'ST', 'SETS': 'ST', 'KIT': 'ST', 'KITS': 'ST', 'CONJUNTO': 'ST', 'CONJUNTOS': 'ST', 'DUO': 'ST', 'DUOS': 'ST', 'PAR': 'ST', 'PARES': 'ST', 'PAREJA': 'ST', 'PAREJAS': 'ST',
            'LE': 'LE', 'LENTE': 'LE', 'LENTES': 'LE', 'GAFA': 'LE', 'GAFAS': 'LE', 'LUPA': 'LE', 'LUPAS': 'LE', 'ANTEOJO': 'LE', 'ANTEOJOS': 'LE',
            'TO': 'TO', 'TOBILLERA': 'TO', 'TOBILLERAS': 'TO',
            'RE': 'RE', 'RELOJ': 'RE', 'RELOJES': 'RE',
            'PI': 'PI', 'PIERCING': 'PI', 'PIERCINGS': 'PI',
            'AC': 'OT', 'ACCESORIO': 'OT', 'ACCESORIOS': 'OT',
            'OT': 'OT', 'OTRO': 'OT', 'OTROS': 'OT'
        }
        categoria = CAT_MAP.get(cat_raw, cat_raw)
        if not categoria:
            errors.append(f"Fila {row_idx}: La categoría es requerida.")
        elif categoria not in categorias_validas:
            errors.append(f"Fila {row_idx}: Categoría inválida '{categoria}'. Opciones válidas: {list(categorias_validas.keys())}")
        else:
            if not grouped[product_key]['categoria']:
                grouped[product_key]['categoria'] = categoria

        # 2. genero (required) - with smart normalization (e.g. SET/PAR/DUO -> U)
        gen_raw = row_dict.get('genero', '').strip().upper()
        GEN_MAP = {
            'M': 'M', 'HOMBRE': 'M', 'MASCULINO': 'M', 'VARON': 'M', 'CABALLERO': 'M',
            'F': 'F', 'MUJER': 'F', 'FEMENINO': 'F', 'DAMA': 'F',
            'U': 'U', 'UNISEX': 'U', 'UNI': 'U', 'SET': 'U', 'PAR': 'U', 'DUO': 'U', 'COMBO': 'U', 'AMBOS': 'U', '': 'U'
        }
        genero = GEN_MAP.get(gen_raw, gen_raw) if gen_raw else 'U'
        if genero not in generos_validos:
            errors.append(f"Fila {row_idx}: Género inválido '{genero}'. Opciones válidas: {list(generos_validos.keys())}")
        else:
            if not grouped[product_key]['genero']:
                grouped[product_key]['genero'] = genero

        # 4. moneda_compra (required) - with smart normalization
        mon_raw = row_dict.get('moneda_compra', '').strip().upper()
        MON_MAP = {
            'USD': 'USD', '$': 'USD', 'DOLAR': 'USD', 'DOLARES': 'USD',
            'BRL': 'BRL', 'R$': 'BRL', 'REAL': 'BRL', 'REALES': 'BRL',
            'PYG': 'PYG', 'GS': 'PYG', 'GS.': 'PYG', 'GUARANI': 'PYG', 'GUARANIES': 'PYG',
            'ARS': 'ARS', 'PESO': 'ARS', 'PESOS': 'ARS',
            'CNY': 'CNY', '¥': 'CNY', 'YUAN': 'CNY', 'YUANES': 'CNY', 'RMB': 'CNY',
        }
        moneda = MON_MAP.get(mon_raw, mon_raw) if mon_raw else 'USD'
        if not moneda:
            errors.append(f"Fila {row_idx}: La moneda de compra es requerida.")
        elif moneda not in monedas_validas:
            errors.append(f"Fila {row_idx}: Moneda inválida '{moneda}'. Opciones válidas: {list(monedas_validas.keys())}")
        else:
            if not grouped[product_key]['moneda_compra']:
                grouped[product_key]['moneda_compra'] = moneda

        # 5. costo_moneda_origen (optional but must be valid if present)
        costo_str = row_dict.get('costo_moneda_origen', '').strip()
        if costo_str:
            try:
                costo = float(costo_str)
                if costo < 0:
                    errors.append(f"Fila {row_idx}: El costo no puede ser negativo.")
                else:
                    # Mark that we have at least one valid cost for this product
                    grouped[product_key]['validaciones']['costo_valido'] = True
                    if grouped[product_key]['costo_moneda_origen'] is None or costo < grouped[product_key]['costo_moneda_origen']:
                        grouped[product_key]['costo_moneda_origen'] = costo
            except ValueError:
                errors.append(f"Fila {row_idx}: Costo moneda origen inválido '{costo_str}'. Debe ser un número decimal.")
        # If empty, we'll leave it as None and check later if product has any valid cost

        # 6. peso_gramos (optional but must be valid if present)
        peso_str = row_dict.get('peso_gramos', '').strip()
        if peso_str:
            try:
                peso = int(float(peso_str))  # Handle floats like "5.0"
                if peso < 0:
                    errors.append(f"Fila {row_idx}: El peso no puede ser negativo.")
                else:
                    grouped[product_key]['validaciones']['peso_valido'] = True
                    if grouped[product_key]['peso_gramos'] is None or peso < grouped[product_key]['peso_gramos']:
                        grouped[product_key]['peso_gramos'] = peso
            except ValueError:
                errors.append(f"Fila {row_idx}: Peso en gramos inválido '{peso_str}'. Debe ser un número entero.")
        # If empty, leave as None

        # 7. precio_venta (optional but must be valid if present)
        precio_str = row_dict.get('precio_venta', '').strip()
        if precio_str:
            try:
                precio = int(float(precio_str))
                if precio < 0:
                    errors.append(f"Fila {row_idx}: El precio de venta no puede ser negativo.")
                else:
                    grouped[product_key]['validaciones']['precio_valido'] = True
                    if grouped[product_key]['precio_venta'] is None or precio < grouped[product_key]['precio_venta']:
                        grouped[product_key]['precio_venta'] = precio
            except ValueError:
                errors.append(f"Fila {row_idx}: Precio de venta inválido '{precio_str}'. Debe ser un número entero.")
        # If empty, leave as None

        # 8. descripcion (optional)
        descripcion = row_dict.get('descripcion', '').strip()
        # For product-level, we'll concatenate or take first non-empty
        if descripcion and not grouped[product_key]['descripcion']:
            grouped[product_key]['descripcion'] = descripcion

        # 9. materiales (optional)
        materiales_str = row_dict.get('materiales', '').strip()
        if materiales_str:
            # Split by common separators: ; , /
            materiales = [m.strip() for m in re.split('[;,/]', materiales_str) if m.strip()]
            invalid_materials = []
            valid_materials = []
            for mat in materiales:
                if mat in existing_materials:
                    valid_materials.append(mat)
                else:
                    invalid_materials.append(mat)
                    warnings.append(f"Fila {row_idx}: Material '{mat}' no encontrado. Se creará automáticamente durante la importación.")

            # For product-level, we'll collect all unique materials
            current_materiales = set(grouped[product_key]['materiales']) if grouped[product_key]['materiales'] else set()
            current_materiales.update(valid_materials)
            grouped[product_key]['materiales'] = list(current_materiales)

        # 10. url_origen (optional)
        url_origen = clean_url(row_dict.get('url_origen'))
        if url_origen and not grouped[product_key]['url_origen']:
            grouped[product_key]['url_origen'] = url_origen

        # 11. url_imagen (optional)
        url_imagen = clean_url(row_dict.get('url_imagen'))
        if url_imagen and not grouped[product_key]['url_imagen']:
            grouped[product_key]['url_imagen'] = url_imagen

        # 12. color (for variant)
        color = row_dict.get('color', '').strip() or 'Único'

        # 13. talle_medida (for variant)
        talle_medida = row_dict.get('talle_medida', '').strip() or 'Ajustable'

        # 14. stock (for variant)
        stock_str = row_dict.get('stock', '').strip()
        try:
            stock = int(float(stock_str)) if stock_str else 1
            if stock < 0:
                errors.append(f"Fila {row_idx}: El stock no puede ser negativo.")
            else:
                # Add variant to this product — each variant carries its own image URL
                # so each color can have a different photo from the supplier
                grouped[product_key]['variantes'].append({
                    'color': color,
                    'talle_medida': talle_medida,
                    'stock': stock,
                    'imagen_url': url_imagen,   # image specific to this row/color
                })
        except ValueError:
            errors.append(f"Fila {row_idx}: Stock inválido '{stock_str}'. Debe ser un número entero.")

    # Post-processing: validate product-level requirements
    for product_key, producto in grouped.items():
        # Check that we have at least one valid cost for the product
        if not producto['validaciones']['costo_valido']:
            errors.append(f"Producto '{producto['nombre']}': Debe tener al menos una fila con costo_moneda_origen válido (número decimal no negativo).")

        # Check that we have at least one valid peso for the product
        if not producto['validaciones']['peso_valido']:
            errors.append(f"Producto '{producto['nombre']}': Debe tener al menos una fila con peso_gramos válido (entero no negativo).")

        # Check that we have at least one valid precio for the product
        if not producto['validaciones']['precio_valido']:
            errors.append(f"Producto '{producto['nombre']}': Debe tener al menos una fila con precio_venta válido (entero no negativo).")

        # Clean up temporary fields for output
        del producto['filas_origen']
        del producto['validaciones']

    # Prepare response
    response_data = {
        'productos': list(grouped.values()),
        'errores': errors,
        'advertencias': warnings  # Using 'advertencias' for Spanish
    }

    # If there are errors, return bad request
    if errors:
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    # If no errors but there are warnings, still return OK
    return Response(response_data, status=status.HTTP_200_OK)
