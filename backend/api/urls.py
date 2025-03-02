from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('auth/callback/', views.register_by_access_token, name='auth_callback'),
    path('home/', views.home, name='home'),
    path('login_signup/', views.login_signup, name='login_signup'),
    path('plans/', views.plans, name='plans'),
    path('tutorial/', views.tutorial, name='tutorial'),
    path('account/', views.account, name='account'),
    path('ocr/process/', views.process_ocr, name='process_ocr'),  # Add this new endpoint
    # Payment endpoints
    path('payments/create-order/', views.create_payment_order, name='create_payment_order'),
    path('payments/verify/', views.verify_payment, name='verify_payment'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('payments/webhook/', views.razorpay_webhook, name='razorpay_webhook'),

]