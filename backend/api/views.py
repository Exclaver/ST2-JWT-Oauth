from django.http import JsonResponse,HttpResponse
from django.shortcuts import redirect
from django.contrib.auth import login
from django.contrib.auth.models import User
from social_django.utils import psa
from .models import Profile,Plan
from django.views.decorators.csrf import csrf_exempt
import json
import requests
from .utils import check_and_deduct_credits
from social_django.models import UserSocialAuth
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import jwt

@csrf_exempt
def process_ocr(request):
    """Process image with OCR and return detected text"""
    try:
        # Extract OAuth token from header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid authorization header'}, status=401)
            
        # Extract the token
        jwt_token = auth_header.replace('Bearer ', '', 1).strip()
        print(f"Received token: {jwt_token[:20]}...")  # Onl
        # Try to get user from the token - using exact match instead of contains
        try:
            # Get profile by oauth_id (which should be the token)
            decoded_token = jwt.decode(
                jwt_token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
            user_id = decoded_token['user_id']
            user = User.objects.get(id=user_id)

            print(f"Found user: {user_id}")
        except (jwt.InvalidTokenError, User.DoesNotExist):
            return JsonResponse({'error': 'Invalid or expired token'}, status=401)
        
        # Check if user has credits
        can_proceed, message = check_and_deduct_credits(user)
        if not can_proceed:
            return JsonResponse({'error': message}, status=403)
        
        # Get image data from request
        data = json.loads(request.body)
        base64_image = data.get('image')
        
        if not base64_image:
            return JsonResponse({'error': 'No image data provided'}, status=400)
        
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
        return JsonResponse(ocr_data)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

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

            # Find or create user by Google ID
            try:
                profile = Profile.objects.get(google_id=google_id)
                user = profile.user
                # Update email if changed
                if profile.email != email:
                    profile.email = email
                    profile.save()
            except Profile.DoesNotExist:
                # Create new user with Google ID as username
                username = f"google_{google_id}"  # Ensure unique username
                user = User.objects.create_user(
                    username=username,
                    email=email
                )
                free_plan = Plan.objects.get(name='free')
                profile = Profile.objects.create(
                    user=user,
                    google_id=google_id,
                    email=email,
                    full_name=full_name,
                    credits_remaining=free_plan.requests_per_month,
                    plan=free_plan
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
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)
def home(request):
    return HttpResponse("Home Page")

def login_signup(request):
    return HttpResponse("Login/Signup Page")

from django.http import JsonResponse
from .models import Plan

def plans(request):
    plans = Plan.objects.filter(is_active=True)
    plans_data = [{
        'id': plan.id,
        'name': plan.get_name_display(),
        'price': float(plan.price),
        'requests_per_month': plan.requests_per_month,
        'is_active': plan.is_active,
    } for plan in plans]
    return JsonResponse({'plans': plans_data})

def tutorial(request):
    return HttpResponse("Tutorial Page")

def account(request):
    return HttpResponse("Account Page")