from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import redirect
from .models import TeamMitglied, Bewerbung, Einstellungen

@admin.register(TeamMitglied)
class TeamMitgliedAdmin(admin.ModelAdmin):
    list_display = ['name', 'klasse', 'gruppe']
    list_filter = ['gruppe']
    search_fields = ['name']
    fields = ['gruppe', 'name', 'klasse', 'zusatzfeld', 'email', 'bild']

    class Media:
        js = ('admin/js/team_fields.js',)

@admin.register(Bewerbung)
class BewerbungAdmin(admin.ModelAdmin):
    list_display = ['nachname', 'vorname', 'klasse', 'geburtsdatum', 'telefonnummer', 'email', 'eingegangen_am']
    list_filter = ['klasse']
    search_fields = ['vorname', 'nachname']
    readonly_fields = ['eingegangen_am']

@admin.register(Einstellungen)
class EinstellungenAdmin(admin.ModelAdmin):
    list_display = ['wartungsmodus_status', 'wartungsmodus_toggle']
    readonly_fields = ['wartungsmodus_toggle']

    def wartungsmodus_status(self, obj):
        if obj.wartungsmodus:
            return format_html('<span style="color: red; font-weight: bold;">🔴 Wartungsmodus AN</span>')
        return format_html('<span style="color: green; font-weight: bold;">🟢 Wartungsmodus AUS</span>')
    wartungsmodus_status.short_description = 'Status'

    def wartungsmodus_toggle(self, obj):
        if obj.wartungsmodus:
            return format_html(
                '<a class="button" href="/admin/team/einstellungen/wartung-aus/" style="background: green; color: white; padding: 6px 12px; border-radius: 4px;">✅ Wartungsmodus ausschalten</a>'
            )
        return format_html(
            '<a class="button" href="/admin/team/einstellungen/wartung-an/" style="background: red; color: white; padding: 6px 12px; border-radius: 4px;">🔧 Wartungsmodus einschalten</a>'
        )
    wartungsmodus_toggle.short_description = 'Aktion'

    def get_urls(self):
        urls = super().get_urls()
        extra_urls = [
            path('wartung-an/', self.admin_site.admin_view(self.wartung_an)),
            path('wartung-aus/', self.admin_site.admin_view(self.wartung_aus)),
        ]
        return extra_urls + urls

    def wartung_an(self, request):
        einstellungen = Einstellungen.objects.first()
        einstellungen.wartungsmodus = True
        einstellungen.save()
        self.message_user(request, '🔴 Wartungsmodus wurde eingeschaltet!')
        return redirect('/admin/team/einstellungen/')

    def wartung_aus(self, request):
        einstellungen = Einstellungen.objects.first()
        einstellungen.wartungsmodus = False
        einstellungen.save()
        self.message_user(request, '🟢 Wartungsmodus wurde ausgeschaltet!')
        return redirect('/admin/team/einstellungen/')