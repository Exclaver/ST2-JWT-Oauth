from django.utils import timezone
from datetime import timedelta

def check_and_deduct_credits(user):
    """
    Check if user has credits available and deducts one credit if available
    Returns a tuple of (can_proceed, message)
    """
    try:
        profile = user.profile
        
        # Check if user has credits remaining
        if profile.credits_remaining <= 0:
            # Check if they have a paid plan
            if not profile.plan or profile.plan.name == 'free':
                return False, "You have used all your free credits. Please upgrade your plan."
            
            # Check if plan is expired
            if profile.plan_expiry and profile.plan_expiry < timezone.now():
                return False, "Your subscription has expired. Please renew your plan."
                
            # Check if credits need to be replenished (beginning of new billing cycle)
            if (profile.billing_cycle_start and 
                timezone.now() >= profile.billing_cycle_start + timedelta(days=30)):
                # Reset billing cycle and replenish credits
                profile.billing_cycle_start = timezone.now()
                profile.credits_remaining = profile.plan.requests_per_month
                profile.save()
        
        # Deduct one credit
        profile.credits_remaining -= 1
        profile.save()
        
        return True, "Credit deducted successfully"
    except Exception as e:
        return False, f"Error checking credits: {str(e)}"