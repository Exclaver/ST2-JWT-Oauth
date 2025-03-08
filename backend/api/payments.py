import razorpay
from django.conf import settings
from .models import Payment, Profile, Plan
from django.utils import timezone
import datetime
import logging

logger = logging.getLogger(__name__)

# Initialize Razorpay client
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

def create_order(user, plan_id):
    """
    Creates a Razorpay order for the given plan
    Returns order details needed for checkout
    """
    try:
        plan = Plan.objects.get(id=plan_id)
        
        # Convert price to paise (Razorpay uses smallest currency unit)
        amount_in_paise = int(float(plan.price) * 100)
        
        # Create Razorpay order
        order_data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'receipt': f'plan_{plan_id}_{user.id}',
            'notes': {
                'user_id': user.id,
                'plan_id': plan_id
            }
        }
        
        razorpay_order = client.order.create(data=order_data)
        
        # Save payment record in database
        payment = Payment.objects.create(
            user=user,
            plan=plan,
            razorpay_order_id=razorpay_order['id'],
            razorpay_payment_id='',  # Will be updated after payment
            amount=plan.price,
            status='pending'
        )
        
        return {
            'order_id': razorpay_order['id'],
            'amount': amount_in_paise,
            'currency': 'INR',
            'key_id': settings.RAZORPAY_KEY_ID
        }
    except Exception as e:
        logger.error(f"Error creating Razorpay order: {e}")
        raise

def verify_payment(payment_id, order_id, signature):
    """
    Verifies the payment signature and updates the payment status
    Returns True if payment is successful, False otherwise
    """
    try:
        # Create signature verification data
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }
        
        # Verify signature
        client.utility.verify_payment_signature(params_dict)
        
        # Update payment record
        payment = Payment.objects.get(razorpay_order_id=order_id)
        payment.razorpay_payment_id = payment_id
        payment.status = 'completed'
        payment.save()
        
        # Update user profile with credits
        update_user_credits(payment)
        
        return True
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        
        # Update payment status to failed
        try:
            payment = Payment.objects.get(razorpay_order_id=order_id)
            payment.razorpay_payment_id = payment_id
            payment.status = 'failed'
            payment.save()
        except Payment.DoesNotExist:
            pass
            
        return False

def update_user_credits(payment):
    """
    Updates user's profile with credits based on the purchased plan
    Sets plan expiry date to 30 days from now
    """
    try:
        profile = payment.user.profile
        
        # Update profile with new plan
        profile.plan = payment.plan
        
        # Add credits from the plan
        profile.credits_remaining += payment.plan.requests_per_month
        
        # Set plan expiry date to 30 days from now
        profile.plan_expiry = timezone.now() + datetime.timedelta(days=30)
        
        # Set billing cycle start date to today
        profile.billing_cycle_start = timezone.now()
        
        profile.save()
    except Exception as e:
        logger.error(f"Error updating user credits: {e}")
        raise