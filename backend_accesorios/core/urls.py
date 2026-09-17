from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

# Personalización del panel de administración
admin.site.site_header = "Joyas & Accesorios PY - Panel de Gestión"
admin.site.site_title = "Accesorios PY"
admin.site.index_title = "Administración de Inventario, Importaciones y Ventas"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tienda.api_urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
