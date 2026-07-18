from django.shortcuts import render

class WartungsmodusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Admin und Staff immer durchlassen
        if request.path.startswith('/admin') or (
            hasattr(request, 'user') and
            request.user.is_authenticated and
            request.user.is_staff
        ):
            return self.get_response(request)

        # Wartungsmodus aus Datenbank prüfen
        try:
            from .models import Einstellungen
            einstellungen = Einstellungen.objects.first()
            if einstellungen and einstellungen.wartungsmodus:
                return render(request, 'pages/wartung.html', status=503)
        except Exception:
            pass

        return self.get_response(request)