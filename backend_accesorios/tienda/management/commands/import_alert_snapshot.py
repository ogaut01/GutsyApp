import json
import os
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from tienda.models import (
    DetalleVenta,
    Material,
    Plataforma,
    Producto,
    ProveedorReal,
    VarianteProducto,
    Venta,
)


class Command(BaseCommand):
    help = 'Importa una instantánea sanitizada de catálogo y ventas para pruebas locales.'

    def add_arguments(self, parser):
        parser.add_argument('snapshot', help='Ruta del JSON sanitizado.')
        parser.add_argument('--username', default='admin', help='Usuario administrador local.')

    def handle(self, *args, **options):
        snapshot_path = Path(options['snapshot'])
        if not snapshot_path.is_file():
            raise CommandError(f'No existe la instantánea: {snapshot_path}')
        if Producto.objects.exists() or Venta.objects.exists():
            raise CommandError('La base de destino no está vacía. Usá una base SQLite nueva para proteger tus datos locales.')

        with snapshot_path.open(encoding='utf-8-sig') as snapshot_file:
            snapshot = json.load(snapshot_file)

        products = snapshot.get('productos', [])
        sales = snapshot.get('ventas', [])
        material_sources = [
            item
            for source in snapshot.get('materiales', [])
            for item in (source if isinstance(source, list) else [source])
        ]
        platform, _ = Plataforma.objects.get_or_create(
            nombre='Snapshot de producción',
            defaults={'pais_origen': 'PY', 'moneda_defecto': 'PYG'},
        )

        with transaction.atomic():
            material_map = {}
            for source in material_sources:
                material, _ = Material.objects.get_or_create(
                    nombre=source.get('nombre', 'Sin material'),
                    defaults={'descripcion': source.get('descripcion')},
                )
                material_map[source.get('id')] = material

            provider_map = {}
            for source in products:
                source_provider_id = source.get('proveedor_real')
                if source_provider_id and source_provider_id not in provider_map:
                    provider_map[source_provider_id], _ = ProveedorReal.objects.get_or_create(
                        plataforma=platform,
                        nombre=source.get('proveedor_nombre') or f'Proveedor #{source_provider_id}',
                    )

            product_rows = []
            for source in products:
                product_rows.append(Producto(
                    id=source['id'],
                    nombre=source.get('nombre', ''),
                    categoria=source.get('categoria', 'OT'),
                    genero=source.get('genero', 'U'),
                    plataforma=platform,
                    proveedor_real=provider_map.get(source.get('proveedor_real')),
                    url_producto=source.get('url_producto'),
                    imagen_url=source.get('imagen_url') or source.get('imagen_url_completa'),
                    descripcion=source.get('descripcion'),
                    costo_moneda_origen=source.get('costo_moneda_origen'),
                    moneda_compra=source.get('moneda_compra', 'USD'),
                    peso_gramos=source.get('peso_gramos') or 15,
                    costo_pyg=source.get('costo_pyg') or 0,
                    precio_venta=source.get('precio_venta') or 0,
                    activo=source.get('activo', True),
                ))
            Producto.objects.bulk_create(product_rows)

            products_by_id = Producto.objects.in_bulk()
            for source in products:
                product = products_by_id[source['id']]
                product.materiales.set([
                    material_map[material['id']]
                    for material in source.get('materiales', [])
                    if material.get('id') in material_map
                ])

            variant_rows = []
            for source in products:
                for variant in source.get('variantes', []):
                    variant_rows.append(VarianteProducto(
                        id=variant['id'],
                        producto_id=source['id'],
                        color=variant.get('color') or 'Único',
                        talle_medida=variant.get('talle_medida') or 'Ajustable',
                        sku=variant.get('sku'),
                        stock=variant.get('stock') or 0,
                        precio_venta=variant.get('precio_venta'),
                        codigo_barras=variant.get('codigo_barras'),
                        imagen_url=variant.get('imagen_url'),
                        activo=variant.get('activo', True),
                    ))
            VarianteProducto.objects.bulk_create(variant_rows)

            Venta.objects.bulk_create([
                Venta(
                    id=sale['id'],
                    fecha_venta=sale['fecha_venta'],
                    metodo_pago=sale.get('metodo_pago', 'QRD'),
                    total_cobrado=sale.get('total_cobrado') or 0,
                )
                for sale in sales
            ])
            DetalleVenta.objects.bulk_create([
                DetalleVenta(
                    venta_id=sale['id'],
                    variante_id=detail['variante'],
                    cantidad=detail.get('cantidad') or 1,
                    precio_unitario=detail.get('precio_unitario'),
                )
                for sale in sales
                for detail in sale.get('detalles', [])
            ])

            password = os.environ.get('LOCAL_SNAPSHOT_ADMIN_PASSWORD')
            if not password:
                raise CommandError('Definí LOCAL_SNAPSHOT_ADMIN_PASSWORD para crear el administrador local.')
            get_user_model().objects.create_superuser(options['username'], '', password)

        self.stdout.write(self.style.SUCCESS(
            f'Instantánea importada: {len(products)} productos, {len(variant_rows)} variantes y {len(sales)} ventas.'))
