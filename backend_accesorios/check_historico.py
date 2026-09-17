from tienda.models import Producto, ItemLote
# Find our Anillo Ares Biselado product
producto = Producto.objects.get(nombre='Anillo Ares Biselado')
print('Producto: {}'.format(producto.nombre))
print('Proveedor actual (proveedor_real): {}'.format(producto.proveedor_real.nombre if producto.proveedor_real else None))
print()

# Check if there are any ItemLote records for this product
itemlotes = ItemLote.objects.filter(producto=producto).select_related('proveedor_historico', 'lote')
print('Registros históricos encontrados (ItemLote): {}'.format(itemlotes.count()))
for il in itemlotes:
    proveedor_hist = il.proveedor_historico.nombre if il.proveedor_historico else 'None'
    lote_name = il.lote.nombre_referencia if il.lote else 'None'
    print('  Lote: {} -> Proveedor histórico: {}'.format(lote_name, proveedor_hist))