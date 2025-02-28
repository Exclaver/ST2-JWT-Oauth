from django.http import JsonResponse,HttpResponse
from django.shortcuts import redirect
from django.contrib.auth import login
from django.contrib.auth.models import User
from social_django.utils import psa
from .models import Profile,Plan,Payment
from django.views.decorators.csrf import csrf_exempt
import json
import requests
from .utils import check_and_deduct_credits
from social_django.models import UserSocialAuth
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import jwt
from .payments import create_order, verify_payment as verify_razorpay_payment
from django.views.decorators.http import require_POST
from django.utils import timezone
import datetime
# Add these imports at the top of your file
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@csrf_exempt
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_payment_order(request):
    """Creates a Razorpay order for plan purchase"""
    try:
        # No need to parse the token - user is already available
        user = request.user
        
        # Get plan_id from request
        plan_id = request.data.get('plan_id')
        
        if not plan_id:
            return Response({'error': 'Plan ID is required'}, status=400)
        
        # Create Razorpay order
        order_data = create_order(user, plan_id)
        
        return Response(order_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
@csrf_exempt
@api_view(['POST'])
def verify_payment(request):
    """Verifies Razorpay payment and updates user credits"""
    try:
        payment_id = request.data.get('razorpay_payment_id')
        order_id = request.data.get('razorpay_order_id')
        signature = request.data.get('razorpay_signature')
        
        if not all([payment_id, order_id, signature]):
            return Response({'error': 'Missing payment verification parameters'}, status=400)
        
        # Verify payment
        is_success = verify_razorpay_payment(payment_id, order_id, signature)
        
        if is_success:
            try:
                # Get payment details for response
                payment = Payment.objects.get(razorpay_order_id=order_id)
                profile = payment.user.profile
                
                return Response({
                    'success': True,
                    'message': 'Payment successful',
                    'credits': profile.credits_remaining,
                    'plan': payment.plan.get_name_display(),
                })
            except Payment.DoesNotExist:
                return Response({'success': True, 'message': 'Payment successful but details not found'})
        else:
            return Response({'error': 'Payment verification failed'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
@csrf_exempt
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def process_ocr(request):
    """Process image with OCR and return detected text"""
    try:
        # User is automatically available from the token
        user = request.user
        
        # Check if user has credits
        can_proceed, message = check_and_deduct_credits(user)
        if not can_proceed:
            return Response({'error': message}, status=403)
        
        # Get image data from request
        base64_image = request.data.get('image')
        
        if not base64_image:
            return Response({'error': 'No image data provided'}, status=400)
        
        # Remove potential prefix in base64 string
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
            
        # Send request to Google Cloud Vision API
        api_key = "AIzaSyCtO1oprbK6g-kK-LHR2HxnOhvgeS7Rilo"
        url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
        payload = {
            "requests": [{
                "image": {
                    "content": base64_image
                },
                "features": [{
                    "type": "TEXT_DETECTION"
                }]
            }]
        }
        
        # Make request to Google Cloud Vision API
        response = requests.post(url, json=payload)
        ocr_data = response.json()
        
        # Return response to client
        return Response(ocr_data)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
@csrf_exempt
def register_by_access_token(request, backend='google-oauth2'):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            google_token = data.get('access_token')

            # Verify Google token
            try:
                google_info = jwt.decode(google_token, options={"verify_signature": False})
                google_id = google_info['sub']  # Google's unique identifier
                email = google_info['email']
                full_name = google_info.get('name', '')
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid Google token'}, status=401)

            # Generate username based on Google ID
            username = f"google_{google_id}"

            # Find or create user by Google ID (first check Profile, then check by username)
            try:
                # First try to find by Google ID
                profile = Profile.objects.get(google_id=google_id)
                user = profile.user
                
                # Update email and name if changed
                if profile.email != email or profile.full_name != full_name:
                    profile.email = email
                    profile.full_name = full_name
                    profile.save()
            except Profile.DoesNotExist:
                try:
                    # Then try to find by username
                    user = User.objects.get(username=username)
                    
                    # User exists but profile doesn't - create profile
                    free_plan = Plan.objects.get(name='free')
                    plan_expiry = timezone.now() + datetime.timedelta(days=30)
                    
                    profile = Profile.objects.create(
                        user=user,
                        google_id=google_id,
                        email=email,
                        full_name=full_name,
                        credits_remaining=free_plan.requests_per_month,
                        plan=free_plan,
                        plan_expiry=plan_expiry,
                        billing_cycle_start=timezone.now()
                    )
                except User.DoesNotExist:
                    # Create new user with Google ID as username
                    user = User.objects.create_user(
                        username=username,
                        email=email
                    )
                    
                    free_plan = Plan.objects.get(name='free')
                    plan_expiry = timezone.now() + datetime.timedelta(days=30)
                    
                    profile = Profile.objects.create(
                        user=user,
                        google_id=google_id,
                        email=email,
                        full_name=full_name,
                        credits_remaining=free_plan.requests_per_month,
                        plan=free_plan,
                        plan_expiry=plan_expiry,
                        billing_cycle_start=timezone.now()
                    )

            # Generate JWT tokens with expiration
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response_data = {
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': profile.email,
                    'full_name': profile.full_name,
                    'credits_remaining': profile.credits_remaining,
                    'plan': profile.plan.name if profile.plan else 'free',
                },
                'tokens': {
                    'access': access_token,
                    'refresh': str(refresh),
                    'expires_in': 3600  # 1 hour expiration
                }
            }

            return JsonResponse(response_data)
            
        except Exception as e:
            # Improve error reporting
            import traceback
            error_details = str(e) + "\n" + traceback.format_exc()
            return JsonResponse({'error': error_details}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)
def home(request):
    return HttpResponse("Home Page")

def login_signup(request):
    return HttpResponse("Login/Signup Page")

from django.http import JsonResponse
from .models import Plan

@api_view(['GET'])
def plans(request):
    """Get available plans"""
    try:
        plans = Plan.objects.filter(is_active=True)
        plans_data = [{
            'id': plan.id,
            'name': plan.get_name_display(),
            'price': float(plan.price),
            'requests_per_month': plan.requests_per_month,
            'is_active': plan.is_active,
        } for plan in plans]
        return Response({'plans': plans_data})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

def tutorial(request):
    return HttpResponse("Tutorial Page")

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def account(request):
    """Return user account details with complete plan info and payment history"""
    try:
        user = request.user
        profile = user.profile
        
        # Get days until renewal
        days_until_renewal = None
        if profile.plan_expiry:
            today = timezone.now()
            if profile.plan_expiry > today:
                days_until_renewal = (profile.plan_expiry - today).days
        
        # Get payment history
        payments = Payment.objects.filter(user=user).order_by('-created_at')[:5]  # Get 5 most recent payments
        payment_history = [{
            'id': payment.id,
            'plan': payment.plan.get_name_display() if payment.plan else 'Unknown',
            'amount': float(payment.amount),
            'status': payment.status,
            'date': payment.created_at.isoformat(),
            'razorpay_payment_id': payment.razorpay_payment_id,
        } for payment in payments]
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': profile.email,
            'full_name': profile.full_name,
            'plan': {
                'name': profile.plan.get_name_display() if profile.plan else 'Free',
                'price': float(profile.plan.price) if profile.plan else 0.00,
                'credits_total': profile.plan.requests_per_month if profile.plan else 0,
                'credits_remaining': profile.credits_remaining,
                'credits_used': profile.plan.requests_per_month - profile.credits_remaining if profile.plan else 0,
                'expiry_date': profile.plan_expiry.isoformat() if profile.plan_expiry else None,
                'days_until_renewal': days_until_renewal,
                'billing_cycle_start': profile.billing_cycle_start.isoformat() if profile.billing_cycle_start else None,
            },
            'payment_history': payment_history
        })
    except Exception as e:
        import traceback
        error_details = str(e) + "\n" + traceback.format_exc()
        return Response({'error': error_details}, status=500)