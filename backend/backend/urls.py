from django.contrib import admin
from django.urls import path, include
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('auth/', include('social_django.urls', namespace='social')),
    path('auth/callback/', views.register_by_access_token, name='auth_callback'),
    path('', views.home, name='home'),
    path('login_signup/', views.login_signup, name='login_signup'),
    path('plans/', views.plans, name='plans'),
    path('tutorial/', views.tutorial, name='tutorial'),
    path('account/', views.account, name='account'),
]