import json
import csv
import io
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Producto, VarianteProducto, Proveedor, Material, Configuracion
from openpyxl import Workbook, load_workbook
from openpyxl.worksheet.datavalidation import DataValidation

@api_view(['POST'])
def carga_masiva_productos_api(request):
    """
    Recibe una lista de productos con sus variantes para validar e insertar
    en una sola transacción atómica.
    """
    items = request.data.get('productos', [])
    if not items or not isinstance(items, list):
        return Response({'error': 'Se requiere una lista de productos válida'}, status=status.HTTP_400_BAD_REQUEST)

    config = Configuracion.get_config()
    creados = 0
    variantes_creadas = 0
    errores = []
    producto_ids = []

    with transaction.atomic():
        for index, item in enumerate(items):
            nombre = item.get('nombre', '').strip()
            if not nombre:
                errores.append(f"Fila {index + 1}: El nombre del producto es obligatorio.")
                continue

            categoria = item.get('categoria', 'OT').upper()
            genero = item.get('genero', 'U').upper()
            proveedor_nombre = item.get('proveedor', 'Shein').strip()
            
            # Buscar o crear proveedor si no existe
            proveedor, _ = Proveedor.objects.get_or_create(
                nombre=proveedor_nombre,
                defaults={'pais_origen': 'CN', 'moneda_defecto': item.get('moneda_compra', 'USD')}
            )

            costo_origen = item.get('costo_moneda_origen')
            moneda = item.get('moneda_compra', 'USD')
            peso = int(item.get('peso_gramos', 15) or 15)
            precio_venta = int(item.get('precio_venta', 0) or 0)

            url_origen = item.get('url_origen', '') or ''

            # Buscar si ya existe el producto base o crearlo
            producto, fue_creado = Producto.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'categoria': categoria if categoria in dict(Producto.CATEGORIAS) else 'OT',
                    'genero': genero if genero in dict(Producto.GENEROS) else 'U',
                    'proveedor': proveedor,
                    'costo_moneda_origen': costo_origen,
                    'moneda_compra': moneda,
                    'peso_gramos': peso,
                    'precio_venta': precio_venta,
                    'url_producto': url_origen or None,
                }
            )
            # Si ya existía pero no tenía url, actualizarla
            if not fue_creado and url_origen and not producto.url_producto:
                producto.url_producto = url_origen
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
                
                var_obj, var_creada = VarianteProducto.objects.get_or_create(
                    producto=producto,
                    color=color_v,
                    talle_medida=talle_v,
                    defaults={'stock': stock_v}
                )
                if not var_creada:
                    var_obj.stock += stock_v
                    var_obj.save()
                variantes_creadas += 1

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
    que estira los proveedores actuales de la base de datos.
    """
    wb = Workbook()
    
    # Hoja 1: Productos
    ws_prod = wb.active
    ws_prod.title = "Productos"
    
    headers = [
        "nombre_modelo", "categoria", "genero", "proveedor", "color", 
        "talle_medida", "stock", "costo_moneda_origen", "moneda_compra", 
        "peso_gramos", "precio_venta", "materiales", "url_origen"
    ]
    ws_prod.append(headers)
    
    # Fila de ejemplo
    ws_prod.append([
        "Anillo Sello Acero Quirurgico 316L", "AN", "M", "Alibaba", "Dorado", "Talle 8", 3, 1.90, "USD", 18, 45000, "Acero Quirurgico", "https://www.aliexpress.com/item/ejemplo"
    ])
    
    # Hoja 2: Listas (Opciones desplegables)
    ws_listas = wb.create_sheet(title="Listas")
    
    # Cargar Categorias
    cats = ['AN', 'CO', 'PU', 'AR', 'TO', 'DJ', 'OT']
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

@api_view(['POST'])
def parsear_archivo_carga_masiva(request):
    """
    Recibe un archivo (CSV o XLSX) vía form-data, lo parsea del lado del servidor
    y devuelve la lista de productos pre-procesados para confirmación en el frontend.
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
            return Response({'error': 'Formato no soportado. Usá archivo .xlsx (Excel) o .csv'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Error al leer archivo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    if len(rows) < 2:
        return Response({'error': 'El archivo no contiene filas de datos'}, status=status.HTTP_400_BAD_REQUEST)
    
    headers = [h.lower() for h in rows[0]]
    if 'nombre_modelo' not in headers:
        return Response({'error': 'Falta la columna obligatoria "nombre_modelo" en el encabezado'}, status=status.HTTP_400_BAD_REQUEST)
    
    grouped = {}
    errors = []
    
    for i, row in enumerate(rows[1:], start=2):
        if not row or not row[0]:
            continue
        
        row_dict = {}
        for idx, h in enumerate(headers):
            if idx < len(row):
                row_dict[h] = row[idx]
            else:
                row_dict[h] = ''
                
        nombre = row_dict.get('nombre_modelo') or row_dict.get('nombre')
        if not nombre:
            errors.append(f"Fila {i}: Nombre del modelo vacío.")
            continue
            
        if nombre not in grouped:
            grouped[nombre] = {
                'nombre': nombre,
                'categoria': row_dict.get('categoria', 'OT') or 'OT',
                'genero': row_dict.get('genero', 'U') or 'U',
                'proveedor': row_dict.get('proveedor', 'Shein') or 'Shein',
                'costo_moneda_origen': float(row_dict.get('costo_moneda_origen') or 0),
                'moneda_compra': row_dict.get('moneda_compra', 'USD') or 'USD',
                'peso_gramos': int(float(row_dict.get('peso_gramos') or 15)),
                'precio_venta': int(float(row_dict.get('precio_venta') or 0)),
                'materiales': row_dict.get('materiales', ''),
                'url_origen': row_dict.get('url_origen', ''),
                'variantes': [],
                'fila_origen': i
            }
            
        color = row_dict.get('color', 'Único') or 'Único'
        talle = row_dict.get('talle_medida') or row_dict.get('talle') or 'Ajustable'
        stock = int(float(row_dict.get('stock') or 1))
        
        grouped[nombre]['variantes'].append({
            'color': color,
            'talle_medida': talle,
            'stock': stock
        })
        
    return Response({
        'productos': list(grouped.values()),
        'errores': errors
    })
