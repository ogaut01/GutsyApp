from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    ProveedorViewSet, CourierViewSet, MaterialViewSet,
    ProductoViewSet, VarianteProductoViewSet, LoteImportacionViewSet,
    VentaViewSet, GastoViewSet, ConfiguracionViewSet, dashboard_stats
)
from .bulk_import_views import (
    carga_masiva_productos_api, descargar_plantilla_excel, parsear_archivo_carga_masiva
)

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet)
router.register(r'couriers', CourierViewSet)
router.register(r'materiales', MaterialViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'variantes', VarianteProductoViewSet)
router.register(r'lotes', LoteImportacionViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'gastos', GastoViewSet)
router.register(r'configuracion', ConfiguracionViewSet, basename='configuracion')

urlpatterns = [
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('productos-carga-masiva/', carga_masiva_productos_api, name='productos-carga-masiva'),
    path('productos-carga-masiva/descargar-plantilla/', descargar_plantilla_excel, name='descargar-plantilla-excel'),
    path('productos-carga-masiva/parsear-archivo/', parsear_archivo_carga_masiva, name='parsear-archivo-carga-masiva'),
    path('', include(router.urls)),
]
