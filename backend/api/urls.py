from django.urls import path
from . import views

urlpatterns = [
    path('auth/callback/', views.register_by_access_token, name='auth_callback'),
    path('home/', views.home, name='home'),
    path('login_signup/', views.login_signup, name='login_signup'),
    path('plans/', views.plans, name='plans'),
    path('tutorial/', views.tutorial, name='tutorial'),
    path('account/', views.account, name='account'),
    path('ocr/process/', views.process_ocr, name='process_ocr'),  # Add this new endpoint

]