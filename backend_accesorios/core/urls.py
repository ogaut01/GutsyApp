from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Personalización del panel de administración
admin.site.site_header = "Joyas & Accesorios PY - Panel de Gestión"
admin.site.site_title = "Accesorios PY"
admin.site.index_title = "Administración de Inventario, Importaciones y Ventas"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tienda.api_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
