import csv
import sys
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from tienda.models import Producto, ProveedorReal, Plataforma, Material, VarianteProducto
import openpyxl


class Command(BaseCommand):
    help = 'Importa productos desde un archivo CSV con validación de datos'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Ruta al archivo CSV a importar')
        parser.add_argument(
            '--update',
            action='store_true',
            help='Actualizar productos existentes (por nombre) en lugar de fallar si ya existen'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Ejecutar sin guardar cambios en la base de datos (solo validar)'
        )

    def handle(self, *args, **options):
        csv_file_path = options['csv_file']
        update_existing = options['update']
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(
                self.style.WARNING('MODO SIMULACIÓN: No se guardarán cambios en la base de datos')
            )

        try:
            # Determinar el tipo de archivo basado en la extensión
            file_extension = csv_file_path.lower().split('.')[-1] if '.' in csv_file_path else ''

            if file_extension == 'xlsx':
                # Procesar archivo Excel
                filas_datos = self._leer_archivo_excel(csv_file_path)
            elif file_extension == 'csv':
                # Procesar archivo CSV
                filas_datos = self._leer_archivo_csv(csv_file_path)
            else:
                raise CommandError(
                    f'Formato de archivo no soportado: {file_extension}. '
                    f'Use .csv o .xlsx'
                )

            # Validar que tenga las columnas esperadas (formato de plantilla de productos)
            expected_columns = {
                'nombre_modelo', 'categoria', 'genero', 'proveedor', 'color',
                'talle_medida', 'stock', 'costo_moneda_origen', 'moneda_compra',
                'peso_gramos', 'precio_venta', 'materiales', 'url_origen', 'url_imagen'
            }

            if not filas_datos:
                raise CommandError('El archivo no contiene filas de datos')

            headers = [h.lower().strip() for h in filas_datos[0]]

            if not expected_columns.issubset(set(headers)):
                missing = expected_columns - set(headers)
                raise CommandError(
                    f'Columnas faltantes en el archivo: {missing}. '
                    f'Columnas disponibles: {headers}'
                )

            # Agrupar filas por nombre de producto para manejar variantes
            productos_agrupados = {}
            errores = []

            for num_fila, fila in enumerate(filas_datos[1:], start=2):  # start=2 porque la fila 1 es encabezado
                nombre = fila.get('nombre_modelo', '').strip()
                if not nombre:
                    # Skip empty rows silently (common at end of files)
                    continue

                if nombre not in productos_agrupados:
                    productos_agrupados[nombre] = {
                        'filas_validadas': [],
                        'numero_fila_primera': num_fila
                    }
                # Validate and convert the fila
                try:
                    validated_fila = self._procesar_fila_producto_dict(fila, num_fila)
                    productos_agrupados[nombre]['filas_validadas'].append(validated_fila)
                except Exception as e:
                    errores.append(f'Fila {num_fila}: {str(e)}')

            # Procesar cada producto agrupado
            productos_creados = 0
            productos_actualizados = 0

            with transaction.atomic():
                for nombre, datos_producto in productos_agrupados.items():
                    try:
                        creado, actualizado = self._procesar_producto_con_variantes(
                            datos_producto['filas_validadas'],
                            datos_producto['numero_fila_primera'],
                            update_existing,
                            dry_run
                        )
                        if creado:
                            productos_creados += 1
                        if actualizado:
                            productos_actualizados += 1
                    except Exception as e:
                        errores.append(f'Producto "{nombre}" (fila {datos_producto["numero_fila_primera"]}): {str(e)}')

                    # Si no es dry-run y hay muchos errores, parar temprano
                    if not dry_run and len(errores) > 10:
                        raise CommandError(
                            f'Demasiados errores ({len(errores)}). Deteniendo importación. '
                            f'Primeros errores: {errores[:5]}'
                        )

                # Si es dry-run, hacer rollback
                if dry_run:
                    raise transaction.TransactionManagementError('Dry run - rollback intencional')

        except FileNotFoundError:
            raise CommandError(f'Archivo no encontrado: {csv_file_path}')
        except Exception as e:
            if isinstance(e, CommandError):
                raise
            raise CommandError(f'Error al procesar el archivo: {str(e)}')

        # Mostrar resumen
        if errores:
            self.stdout.write(
                self.style.WARNING(
                    f'Importación completada con {len(errores)} errores:'
                )
            )
            for error in errores[:10]:  # Mostrar máximo 10 errores
                self.stdout.write(f'  - {error}')
            if len(errores) > 10:
                self.stdout.write(f'  ... y {len(errores) - 10} errores más')
        else:
            self.stdout.write(
                self.style.SUCCESS('Importación completada sin errores')
            )

        accion = "actualizados" if update_existing else "creados"
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'[SIMULACIÓN] Se habrían {accion} {productos_actualizados if update_existing else productos_creados} productos'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Se {accion} {productos_actualizados if update_existing else productos_creados} productos'
                )
            )

    def _procesar_producto_con_variantes(self, variantes_data, primera_fila_num, update_existing, dry_run):
        """Procesa un producto con sus variantes y crea/actualiza en la base de datos
        variantes_data es una lista de diccionarios con los datos validados de cada fila (misma estructura que el CSV header)."""
        if not variantes_data:
            return False, False

        # Tomar los datos del producto de la primera variante (asumiendo que son consistentes)
        primer_variante = variantes_data[0]

        # Extraer datos del producto (usar la primera variante no vacía para cada campo)
        producto_datos = {
            'nombre': '',
            'categoria': '',
            'genero': '',
            'proveedor_nombre': '',
            'costo_moneda_origen': None,
            'moneda_compra': '',
            'peso_gramos': None,
            'precio_venta': None,
            'descripcion': '',
            'materiales_str': '',
            'url_origen': '',
            'url_imagen': ''
        }

        # Recopilar todas las variantes
        variantes_procesadas = []

        for variante_data in variantes_data:
            # Los datos ya están validados por _procesar_fila_producto_dict, así que podemos usarlos directamente
            # Para los datos del producto, tomar el primer valor no vacío
            for campo in ['nombre', 'categoria', 'genero', 'proveedor_nombre',
                         'costo_moneda_origen', 'moneda_compra', 'peso_gramos',
                         'precio_venta', 'descripcion', 'materiales_str',
                         'url_origen', 'url_imagen']:
                # Mapeo de campo en producto_datos a clave en variante_data (que son los mismos que el CSV header)
                clave_csv = {
                    'nombre': 'nombre_modelo',
                    'categoria': 'categoria',
                    'genero': 'genero',
                    'proveedor_nombre': 'proveedor',
                    'costo_moneda_origen': 'costo_moneda_origen',
                    'moneda_compra': 'moneda_compra',
                    'peso_gramos': 'peso_gramos',
                    'precio_venta': 'precio_venta',
                    'descripcion': 'descripcion',
                    'materiales_str': 'materiales',
                    'url_origen': 'url_origen',
                    'url_imagen': 'url_imagen'
                }[campo]
                valor = variante_data[clave_csv]
                if campo in ['costo_moneda_origen', 'peso_gramos', 'precio_venta']:
                    # Para campos numéricos, ya están convertidos a float o int por _procesar_fila_producto
                    if valor is not None:
                        if producto_datos[campo] is None:
                            producto_datos[campo] = valor
                elif valor:  # Para campos de texto, valor es string y puede estar vacío
                    if not producto_datos[campo]:
                        producto_datos[campo] = valor

            # Agregar variante para procesamiento posterior
            variantes_procesadas.append({
                'color': variante_data['color'],
                'talle_medida': variante_data['talle_medida'],
                'stock': variante_data['stock']
            })

        # Validar que tenemos los datos mínimos del producto
        if not producto_datos['nombre']:
            raise ValueError('El nombre del producto es requerido')

        if not producto_datos['categoria']:
            raise ValueError('La categoría es requerida')

        if not producto_datos['genero']:
            raise ValueError('El género es requerido')

        if not producto_datos['proveedor_nombre']:
            raise ValueError('El proveedor es requerido')

        # Obtener o crear el proveedor con una plataforma predeterminada
        # Usar Shein como plataforma predeterminada si está disponible
        plataforma_predeterminada = Plataforma.objects.filter(nombre='Shein').first()
        if not plataforma_predeterminada:
            # Si no existe Shein, usar la primera plataforma disponible
            plataforma_predeterminada = Plataforma.objects.first()

        if not plataforma_predeterminada:
            raise ValueError('No hay plataformas disponibles en la base de datos')

        # Intentar obtener el proveedor con el nombre (case-insensitive) y la plataforma predeterminada
        try:
            proveedor = ProveedorReal.objects.get(
                nombre__iexact=producto_datos['proveedor_nombre'],
                plataforma=plataforma_predeterminada
            )
            proveedor_creado = False
        except ProveedorReal.DoesNotExist:
            # Si no existe, crear un nuevo proveedor con la plataforma predeterminada
            proveedor = ProveedorReal.objects.create(
                nombre=producto_datos['proveedor_nombre'],
                plataforma=plataforma_predeterminada,
                activo=True
            )
            proveedor_creado = True
            self.stdout.write(
                self.style.WARNING(
                    f'Proveedor creado automáticamente: "{producto_datos["proveedor_nombre"]}" '
                    f'(plataforma: {plataforma_predeterminada.nombre})'
                )
            )
        except ProveedorReal.MultipleObjectsReturned:
            # Esto no debería pasar debido a la restricción unique_together, pero por si acaso
            proveedor = ProveedorReal.objects.filter(
                nombre__iexact=producto_datos['proveedor_nombre'],
                plataforma=plataforma_predeterminada
            ).first()
            proveedor_creado = False

        # Validar que la categoría sea válida
        from tienda.models import Producto
        categorias_validas = dict(Producto.CATEGORIAS)
        if producto_datos['categoria'] not in categorias_validas:
            raise ValueError(
                f'Categoría inválida: "{producto_datos["categoria"]}". '
                f'Opciones válidas: {list(categorias_validas.keys())}'
            )

        # Validar que el género sea válido
        generos_validos = dict(Producto.GENEROS)
        if producto_datos['genero'] not in generos_validos:
            raise ValueError(
                f'Género inválido: "{producto_datos["genero"]}". '
                f'Opciones válidas: {list(generos_validos.keys())}'
            )

        # Validar que la moneda sea válida
        monedas_validas = dict(Producto.MONEDA_CHOICES)
        if producto_datos['moneda_compra'] not in monedas_validas:
            raise ValueError(
                f'Moneda inválida: "{producto_datos["moneda_compra"]}". '
                f'Opciones válidas: {list(monedas_validas.keys())}'
            )

        # Validar costo_moneda_origen (debe ser decimal no negativo)
        if producto_datos['costo_moneda_origen'] is None or producto_datos['costo_moneda_origen'] < 0:
            raise ValueError('El costo no puede ser negativo')

        # Validar peso_gramos (debe ser entero no negativo o vacío)
        if producto_datos['peso_gramos'] is None or producto_datos['peso_gramos'] < 0:
            raise ValueError('El peso en gramos debe ser un número entero no negativo')

        # Validar precio_venta (debe ser entero no negativo o vacío)
        if producto_datos['precio_venta'] is None or producto_datos['precio_venta'] < 0:
            raise ValueError('El precio de venta debe ser un número entero no negativo')

        # Verificar si el producto ya existe (por nombre)
        producto_existente = None
        try:
            producto_existente = Producto.objects.get(nombre__iexact=producto_datos['nombre'])
        except Producto.DoesNotExist:
            pass  # No existe, podemos crearlo

        # Si no es dry-run, crear o actualizar el producto
        producto_creado = False
        producto_actualizado = False

        if not dry_run:
            with transaction.atomic():
                if producto_existente and update_existing:
                    # Actualizar producto existente
                    producto = producto_existente
                    producto_actualizado = True
                elif producto_existente and not update_existing:
                    # Producto existe pero no se permite actualización
                    raise ValueError(
                        f'Ya existe un producto con el nombre "{producto_datos["nombre"]}". '
                        f'Use el flag --update para actualizar productos existentes.'
                    )
                else:
                    # Crear nuevo producto
                    producto = Producto(nombre=producto_datos['nombre'])
                    producto_creado = True

                # Asignar campos del producto
                producto.categoria = producto_datos['categoria']
                producto.genero = producto_datos['genero']
                producto.proveedor_real = proveedor
                producto.costo_moneda_origen = producto_datos['costo_moneda_origen']
                producto.moneda_compra = producto_datos['moneda_compra']
                producto.peso_gramos = producto_datos['peso_gramos']
                producto.precio_venta = producto_datos['precio_venta']
                producto.descripcion = producto_datos['descripcion']
                producto.url_producto = producto_datos['url_origen'] or None
                producto.imagen_url = producto_datos['url_imagen'] or None
                producto.save()

                # Procesar materiales
                if producto_datos['materiales_str']:
                    nombres_materiales = [m.strip() for m in producto_datos['materiales_str'].split(';') if m.strip()]
                    materiales_obj = []
                    for nombre_material in nombres_materiales:
                        try:
                            material = Material.objects.get(nombre__iexact=nombre_material)
                            materiales_obj.append(material)
                        except Material.DoesNotExist:
                            # Si el material no existe, lo creamos (opcional)
                            material = Material.objects.create(nombre=nombre_material)
                            materiales_obj.append(material)

                        # Asignar materiales al producto
                        producto.materiales.set(materiales_obj)

                # Crear o actualizar variantes
                for variante_data in variantes_procesadas:
                    color = variante_data['color']
                    talle_medida = variante_data['talle_medida']
                    stock = variante_data['stock']

                    var_obj, var_creada = VarianteProducto.objects.get_or_create(
                        producto=producto,
                        color=color,
                        talle_medida=talle_medida,
                        defaults={'stock': stock}
                    )

                    if not var_creada and update_existing:
                        # Actualizar stock si se solicita actualización
                        var_obj.stock = stock
                        var_obj.save()

                    if var_creada:
                        if not dry_run:
                            self.stdout.write(
                                self.style.SUCCESS(f'Variante creada: {producto.nombre} | {color} - {talle_medida} (Stock: {stock})')
                            )
                    elif not dry_run and update_existing:
                        self.stdout.write(
                            self.style.SUCCESS(f'Variante actualizada: {producto.nombre} | {color} - {talle_medida} (Stock: {stock})')
                        )

                if producto_creado and not dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(f'Producto creado: {producto.nombre} con {len(variantes_procesadas)} variante(s)')
                    )
                elif producto_actualizado and not dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(f'Producto actualizado: {producto.nombre} con {len(variantes_procesadas)} variante(s)')
                    )

        # En dry-run, solo validamos (no hacemos nada)
        # La transacción se hará rollback al final si es dry-run

        return producto_creado, producto_actualizado

    def _leer_archivo_csv(self, file_path):
        """Lee un archivo CSV y retorna una lista de filas (list of dicts)"""
        try:
            with open(file_path, newline='', encoding='utf-8-sig') as csvfile:
                # Detectar delimitador
                sample = csvfile.read(2048)  # Increase sample size to get complete lines
                csvfile.seek(0)
                try:
                    sniffer = csv.Sniffer()
                    delimiter = sniffer.sniff(sample).delimiter
                except Exception:
                    # If sniffer fails, try to guess from the first line
                    first_line = sample.split('\n')[0].strip()
                    # Count occurrences of common delimiters
                    delimiters = [',', ';', '\t', '|']
                    delim_counts = {d: first_line.count(d) for d in delimiters}
                    # Choose the delimiter with the highest count (must be at least 2)
                    delimiter = max(delim_counts, key=delim_counts.get)
                    if delim_counts[delimiter] < 2:
                        # Fallback to comma if no clear delimiter
                        delimiter = ','

                reader = csv.DictReader(csvfile, delimiter=delimiter)
                return [row for row in reader]
        except Exception as e:
            raise Exception(f'Error al leer archivo CSV: {str(e)}')

    def _leer_archivo_excel(self, file_path):
        """Lee un archivo Excel y retorna una lista de filas (list of dicts)"""
        try:
            wb = openpyxl.load_workbook(file_path, data_only=True)
            ws = wb.active

            # Obtener encabezados de la primera fila
            headers = []
            for cell in ws[1]:
                if cell.value is not None:
                    headers.append(str(cell.value).strip().lower())
                else:
                    headers.append('')

            # Convertir filas a diccionarios
            filas = []
            for row in ws.iter_rows(min_row=2, values_only=True):
                # Skip completely empty rows
                if not any(cell is not None and str(cell).strip() for cell in row):
                    continue

                fila_dict = {}
                for idx, header in enumerate(headers):
                    if idx < len(row):
                        value = row[idx]
                        fila_dict[header] = str(value).strip() if value is not None else ''
                    else:
                        fila_dict[header] = ''
                filas.append(fila_dict)

            return filas
        except Exception as e:
            raise Exception(f'Error al leer archivo Excel: {str(e)}')

    def _procesar_fila_producto_dict(self, fila, num_fila):
        """Extrae y valida datos de una fila (como diccionario) del CSV/Excel (nivel de variante)
        Retorna un diccionario con los mismos campos que la fila del CSV pero con valores validados y convertidos."""
        # Extraer y limpiar datos - usar claves normalizadas (minúsculas)
        nombre = fila.get('nombre_modelo', '').strip()
        categoria = fila.get('categoria', '').strip().upper()
        genero = fila.get('genero', '').strip().upper()
        proveedor_nombre = fila.get('proveedor', '').strip()
        color = fila.get('color', '').strip() or 'Único'
        talle_medida = fila.get('talle_medida', '').strip() or 'Ajustable'
        stock_str = fila.get('stock', '').strip()
        costo_moneda_origen = fila.get('costo_moneda_origen', '').strip()
        moneda_compra = fila.get('moneda_compra', '').strip().upper()
        peso_gramos = fila.get('peso_gramos', '').strip()
        precio_venta = fila.get('precio_venta', '').strip()
        descripcion = fila.get('descripcion', '').strip()  # Handle missing column
        materiales_str = fila.get('materiales', '').strip()
        url_origen = fila.get('url_origen', '').strip()
        url_imagen = fila.get('url_imagen', '').strip()

        # Validaciones básicas
        if not nombre:
            raise ValueError('El nombre del producto es requerido')

        if not categoria:
            raise ValueError('La categoría es requerida')

        if not genero:
            raise ValueError('El género es requerido')

        if not proveedor_nombre:
            raise ValueError('El proveedor es requerido')

        # Obtener o crear el proveedor con una plataforma predeterminada
        # Usar Shein como plataforma predeterminada si está disponible
        plataforma_predeterminada = Plataforma.objects.filter(nombre='Shein').first()
        if not plataforma_predeterminada:
            # Si no existe Shein, usar la primera plataforma disponible
            plataforma_predeterminada = Plataforma.objects.first()

        if not plataforma_predeterminada:
            raise ValueError('No hay plataformas disponibles en la base de datos')

        # Intentar obtener el proveedor con el nombre (case-insensitive) y la plataforma predeterminada
        try:
            proveedor = ProveedorReal.objects.get(
                nombre__iexact=proveedor_nombre,
                plataforma=plataforma_predeterminada
            )
            proveedor_creado = False
        except ProveedorReal.DoesNotExist:
            # Si no existe, crear un nuevo proveedor con la plataforma predeterminada
            proveedor = ProveedorReal.objects.create(
                nombre=proveedor_nombre,
                plataforma=plataforma_predeterminada,
                activo=True
            )
            proveedor_creado = True
            self.stdout.write(
                self.style.WARNING(
                    f'Proveedor creado automáticamente: "{proveedor_nombre}" '
                    f'(plataforma: {plataforma_predeterminada.nombre})'
                )
            )
        except ProveedorReal.MultipleObjectsReturned:
            # Esto no debería pasar debido a la restricción unique_together, pero por si acaso
            proveedor = ProveedorReal.objects.filter(
                nombre__iexact=proveedor_nombre,
                plataforma=plataforma_predeterminada
            ).first()
            proveedor_creado = False

        # Validar que la categoría sea válida
        from tienda.models import Producto
        categorias_validas = dict(Producto.CATEGORIAS)
        if categoria not in categorias_validas:
            raise ValueError(
                f'Categoría inválida: "{categoria}". '
                f'Opciones válidas: {list(categorias_validas.keys())}'
            )

        # Validar que el género sea válido
        generos_validos = dict(Producto.GENEROS)
        if genero not in generos_validos:
            raise ValueError(
                f'Género inválido: "{genero}". '
                f'Opciones válidas: {list(generos_validos.keys())}'
            )

        # Validar que la moneda sea válida
        monedas_validas = dict(Producto.MONEDA_CHOICES)
        if moneda_compra not in monedas_validas:
            raise ValueError(
                f'Moneda inválida: "{moneda_compra}". '
                f'Opciones válidas: {list(monedas_validas.keys())}'
            )

        # Validar costo_moneda_origen (debe ser decimal no negativo)
        try:
            costo_moneda_origen_decimal = float(costo_moneda_origen)
            if costo_moneda_origen_decimal < 0:
                raise ValueError('El costo no puede ser negativo')
        except ValueError:
            raise ValueError(
                f'Costo moneda origen inválido: "{costo_moneda_origen}" (fila {num_fila}). '
                f'Debe ser un número decimal no negativo.'
            )

        # Validar peso_gramos (debe ser entero no negativo o vacío)
        if peso_gramos:
            try:
                peso_gramos_int = int(peso_gramos)
                if peso_gramos_int < 0:
                    raise ValueError('El peso no puede ser negativo')
            except ValueError:
                raise ValueError(
                    f'Peso en gramos inválido: "{peso_gramos}". '
                    f'Debe ser un número entero no negativo o vacío.'
                )
        else:
            peso_gramos_int = 0

        # Validar precio_venta (debe ser entero no negativo o vacío)
        if precio_venta:
            try:
                precio_venta_int = int(precio_venta)
                if precio_venta_int < 0:
                    raise ValueError('El precio de venta no puede ser negativo')
            except ValueError:
                raise ValueError(
                    f'Precio de venta inválido: "{precio_venta}". '
                    f'Debe ser un número entero no negativo o vacío.'
                )
        else:
            precio_venta_int = 0

        # Devolver un diccionario con los mismos campos que la fila del CSV pero con valores validados y convertidos
        return {
            'nombre_modelo': nombre,
            'categoria': categoria,
            'genero': genero,
            'proveedor': proveedor_nombre,
            'color': color,
            'talle_medida': talle_medida,
            'stock': int(stock_str) if stock_str else 1,
            'costo_moneda_origen': costo_moneda_origen_decimal,
            'moneda_compra': moneda_compra,
            'peso_gramos': peso_gramos_int,
            'precio_venta': precio_venta_int,
            'descripcion': descripcion,
            'materiales': materiales_str,
            'url_origen': url_origen,
            'url_imagen': url_imagen
        }