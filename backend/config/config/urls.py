from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from two_factor.admin import AdminSiteOTPRequired
from two_factor.urls import urlpatterns as tf_urls

admin.site.__class__ = AdminSiteOTPRequired

class GeschützterUserAdmin(UserAdmin):
    def has_delete_permission(self, request, obj=None):
        if obj is not None and obj.username == 'n.rtbrgr':
            return False
        return super().has_delete_permission(request, obj)

admin.site.unregister(User)
admin.site.register(User, GeschützterUserAdmin)

admin.site.site_header = "TechniX Verwaltung"
admin.site.site_title = "TechniX Admin"
admin.site.index_title = "Willkommen bei der TechniX Verwaltung"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(tf_urls)),
    path('', include('team.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)