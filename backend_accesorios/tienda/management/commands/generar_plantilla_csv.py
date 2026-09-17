from django.core.management.base import BaseCommand
from tienda.models import Plataforma, ProveedorReal, Material, VarianteProducto
import csv
import sys


class Command(BaseCommand):
    help = 'Genera una plantilla CSV de ejemplo con datos reales de la base de datos para importacion de productos y variantes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--filas-ejemplo',
            type=int,
            default=2,
            help='Numero de filas de ejemplo a incluir en la plantilla de productos (default: 2)'
        )
        parser.add_argument(
            '--incluir-variantes',
            action='store_true',
            help='Incluye una plantilla adicional para variantes de productos'
        )
        parser.add_argument(
            '--incluir-instrucciones',
            action='store_true',
            help='Incluye una fila adicional con explicaciones de cada campo'
        )

    def handle(self, *args, **options):
        num_ejemplos = options['filas_ejemplo']
        incluir_variantes = options['incluir_variantes']
        incluir_instrucciones = options['incluir_instrucciones']

        # Obtener datos de la base de datos
        plataformas = list(Plataforma.objects.filter(activo=True))
        proveedores = list(ProveedorReal.objects.select_related('plataforma').filter(activo=True))
        materiales = list(Material.objects.all())

        # Obtener las opciones de elección directamente del modelo
        from tienda.models import Producto
        CATEGORIAS = Producto.CATEGORIAS
        GENEROS = Producto.GENEROS
        MONEDA_CHOICES = Producto.MONEDA_CHOICES

        # Preparar datos de respaldo si la BD esta vacia
        if not plataformas:
            # Usar las opciones del modelo como ejemplos genéricos
            plataformas = [
                type('Plataforma', (), {'nombre': 'Shein', 'pais_origen': 'CN', 'moneda_defecto': 'USD'}),
                type('Plataforma', (), {'nombre': 'Alibaba', 'pais_origen': 'CN', 'moneda_defecto': 'USD'}),
                type('Plataforma', (), {'nombre': 'Mercado Libre', 'pais_origen': 'AR', 'moneda_defecto': 'ARS'})
            ]

        if not proveedores:
            proveedores = [
                type('ProveedorReal', (), {
                    'nombre': 'Shein Oficial',
                    'plataforma': type('Plataforma', (), {'nombre': 'Shein'})
                }),
                type('ProveedorReal', (), {
                    'nombre': 'Alibaba Supplier',
                    'plataforma': type('Plataforma', (), {'nombre': 'Alibaba'})
                }),
                type('ProveedorReal', (), {
                    'nombre': 'AliExpress Store',
                    'plataforma': type('Plataforma', (), {'nombre': 'AliExpress'})
                })
            ]

        if not materiales:
            materiales = [
                type('Material', (), {'nombre': 'Acero Quirurgico / Inoxidable 316L'}),
                type('Material', (), {'nombre': 'Cuero PU / Trenzado'}),
                type('Material', (), {'nombre': 'Oro Laminado / Bano 18K'})
            ]

        # Preparar las filas del CSV de productos
        filas_productos = []

        # Fila de encabezado
        encabezado = [
            'nombre',
            'categoria',
            'genero',
            'proveedor_nombre',
            'plataforma_nombre',
            'costo_moneda_origen',
            'moneda_compra',
            'peso_gramos',
            'precio_venta',
            'descripcion',
            'materiales'
        ]
        filas_productos.append(encabezado)

        # Opcional: fila de instrucciones
        if incluir_instrucciones:
            instrucciones = [
                'Ejemplo: Pulsera Cuero Trenzado con Broche Magnetico Acero',
                'Opciones: AR, CO, PU, AN, TO, DI, OT',
                'Opciones: M, F, U',
                'Nombre exacto de un ProveedorReal existente en la BD',
                'Nombre exacto de una Plataforma existente en la BD',
                'Numero decimal (ej: 2.80)',
                'Opciones: USD, BRL, CNY, ARS, PYG',
                'Numero entero (ej: 25)',
                'Numero entero (opcional, 0 si se deja vacio)',
                'Texto descriptivo (opcional)',
                'Nombres de materiales separados por ";" (ej: Material1;Material2)'
            ]
            filas_productos.append(instrucciones)

        # Generar filas de ejemplo usando datos reales de la BD
        for i in range(min(num_ejemplos, len(plataformas), len(proveedores))):
            plataforma = plataformas[i % len(plataformas)]
            proveedor = proveedores[i % len(proveedores)]
            material = materiales[i % len(materiales)] if materiales else None

            # Variar los ejemplos para mostrar diferentes posibilidades
            if i == 0:
                nombre_ejemplo = f"Producto Ejemplo de {plataforma.nombre}"
                categoria_ejemplo = CATEGORIAS[0][0]  # Primera opción válida
                genero_ejemplo = GENEROS[0][0]
                costo_ejemplo = "10.00"
                moneda_ejemplo = MONEDA_CHOICES[0][0]
                peso_ejemplo = "20"
                precio_ejemplo = "100000"
                descripcion_ejemplo = f"Este es un producto de ejemplo utilizando datos reales de {plataforma.nombre}"
                materiales_ejemplo = material.nombre if material else "Material Ejemplo"
            else:
                nombre_ejemplo = f"Otro Producto - {plataforma.nombre}"
                categoria_ejemplo = CATEGORIAS[1][0] if len(CATEGORIAS) > 1 else CATEGORIAS[0][0]
                genero_ejemplo = GENEROS[1][0] if len(GENEROS) > 1 else GENEROS[0][0]
                costo_ejemplo = "15.50"
                moneda_ejemplo = MONEDA_CHOICES[1][0] if len(MONEDA_CHOICES) > 1 else MONEDA_CHOICES[0][0]
                peso_ejemplo = "30"
                precio_ejemplo = "150000"
                descripcion_ejemplo = f"Ejemplo numero {i+1} con diferentes valores"
                if materiales and len(materiales) > 1:
                    materiales_ejemplo = f"{materiales[i % len(materiales)].nombre};{materiales[(i+1) % len(materiales)].nombre}"
                elif materiales:
                    materiales_ejemplo = materiales[0].nombre
                else:
                    materiales_ejemplo = "Material1;Material2"

            fila = [
                nombre_ejemplo,
                categoria_ejemplo,
                genero_ejemplo,
                proveedor.nombre,
                plataforma.nombre,
                costo_ejemplo,
                moneda_ejemplo,
                peso_ejemplo,
                precio_ejemplo,
                descripcion_ejemplo,
                materiales_ejemplo
            ]
            filas_productos.append(fila)

        # Escribir CSV de productos a stdout
        writer = csv.writer(sys.stdout)
        for fila in filas_productos:
            writer.writerow(fila)

        # Si se solicitó incluir variantes, generar plantilla para variantes
        if incluir_variantes:
            # Separador visual
            sys.stdout.write("\n\n# ==================== PLANTILLA DE VARIANTES ====================\n#\n")
            sys.stdout.write("# Esta plantilla es para variantes de productos (colores, talles, etc.)\n")
            sys.stdout.write("# Primero debe importar los productos usando la plantilla anterior\n")
            sys.stdout.write("# Luego usar esta plantilla para agregar variantes a esos productos\n")
            sys.stdout.write("#\n\n")

            # Encabezado para variantes
            encabezado_variantes = [
                'producto_nombre',
                'color',
                'talle_medida',
                'sku',
                'stock',
                'codigo_barras',
                'activo'
            ]
            writer.writerow(encabezado_variantes)

            # Fila de instrucciones para variantes
            if incluir_instrucciones:
                instrucciones_variantes = [
                    'Nombre exacto del producto existente en la BD',
                    'Ej: Dorado, Negro, Plateado, Azul, Rojo',
                    'Ej: Talle 7, Talle 8, 20cm, Ajustable',
                    'Dejar vacio para auto-generar basado en producto-color-talle',
                    'Numero entero (ej: 10)',
                    'Opcional',
                    'Verdadero/Falso o 1/0'
                ]
                writer.writerow(instrucciones_variantes)

            # Obtener colores reales de variantes existentes
            colores_existentes = list(VarianteProducto.objects.values_list('color', flat=True).distinct())
            if not colores_existentes:
                colores_existentes = ['Dorado', 'Negro', 'Plateado', 'Azul', 'Rojo']  # Ejemplos

            # Generar ejemplos de variantes
            for i in range(min(num_ejemplos, len(filas_productos) - (2 if incluir_instrucciones else 1))):
                # Obtener el nombre del producto de la fila correspondiente
                fila_producto_idx = 2 + i if incluir_instrucciones else 1 + i
                if fila_producto_idx < len(filas_productos):
                    nombre_producto = filas_productos[fila_producto_idx][0]  # Primera columna es nombre
                else:
                    nombre_producto = f"Producto Ejemplo {i+1}"

                color = colores_existentes[i % len(colores_existentes)]
                talle_ejemplo = "Talle 8" if i % 2 == 0 else "20cm"
                sku_ejemplo = ""  # Dejar vacío para auto-generar
                stock_ejemplo = "5"
                codigo_barras_ejemplo = ""
                activo_ejemplo = "1"

                fila_variante = [
                    nombre_producto,
                    color,
                    talle_ejemplo,
                    sku_ejemplo,
                    stock_ejemplo,
                    codigo_barras_ejemplo,
                    activo_ejemplo
                ]
                writer.writerow(fila_variante)

        # Mostrar información de referencia
        sys.stdout.write("\n\n# ==================== INFORMACION DE REFERENCIA ====================\n")
        sys.stdout.write(f"Plataformas disponibles en BD: {len(plataformas)}\n")
        for p in plataformas[:5]:  # Mostrar máximo 5
            sys.stdout.write(f"  - {p.nombre} ({p.get_pais_origen_display()})\n")
        if len(plataformas) > 5:
            sys.stdout.write(f"  ... y {len(plataformas) - 5} mas\n")

        sys.stdout.write(f"\nProveedores disponibles en BD: {len(proveedores)}\n")
        for prov in proveedores[:5]:
            sys.stdout.write(f"  - {prov.nombre} ({prov.plataforma.nombre})\n")
        if len(proveedores) > 5:
            sys.stdout.write(f"  ... y {len(proveedores) - 5} mas\n")

        sys.stdout.write(f"\nMateriales disponibles en BD: {len(materiales)}\n")
        for mat in materiales[:5]:
            sys.stdout.write(f"  - {mat.nombre}\n")
        if len(materiales) > 5:
            sys.stdout.write(f"  ... y {len(materiales) - 5} mas\n")

        # Colores disponibles
        colores_reales = list(VarianteProducto.objects.values_list('color', flat=True).distinct())
        if colores_reales:
            sys.stdout.write(f"\nColores de variantes existentes en BD: {len(colores_reales)}\n")
            for color in colores_reales[:10]:
                sys.stdout.write(f"  - {color}\n")
            if len(colores_reales) > 10:
                sys.stdout.write(f"  ... y {len(colores_reales) - 10} mas\n")
        else:
            sys.stdout.write("\nColores de ejemplo (no hay variantes en BD aún):\n")
            sys.stdout.write("  - Dorado\n")
            sys.stdout.write("  - Negro\n")
            sys.stdout.write("  - Plateado\n")
            sys.stdout.write("  - Azul\n")
            sys.stdout.write("  - Rojo\n")

        sys.stdout.write("\n# ==================== FIN DE LA PLANTILLA ====================\n")