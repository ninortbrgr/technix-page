from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('einblicke/', views.einblicke, name='einblicke'),
    path('unser-team/', views.team, name='team'),
    path('anmeldung/', views.anmeldung, name='anmeldung'),
    path('inventar/', views.inventar, name='inventar'),
    path('wall-of-honor/', views.wall_of_honor, name='wall_of_honor'),
]