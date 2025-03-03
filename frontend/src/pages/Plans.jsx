import React, { useState, useEffect } from 'react';
import { planAPI } from '../api';
import { processPayment } from '../utils/razorpay';
import '../styles/Plans.css';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansData = await planAPI.getPlans();
        setPlans(plansData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load plans');
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanSelect = async (plan) => {
    console.log('Plan selection initiated:', plan);
    
    if (plan.name === 'Free/Trial') {
      console.log('Free plan selected, skipping payment');
      return;
    }
    
    // Clear any previous messages
    setPaymentError(null);
    setPaymentSuccess(null);
    setProcessingPlanId(plan.id);
    console.log('Processing payment for plan:', plan.id);
    
    // Process payment directly
    try {
      console.log('Initiating payment process');
      await processPayment(
        plan.id,
        // Success handler
        (result) => {
          console.log('Payment successful:', result);
          setProcessingPlanId(null);
          setPaymentSuccess({
            message: `Successfully upgraded to ${result.plan} plan! You now have ${result.credits} credits.`,
            plan: result.plan,
            credits: result.credits
          });
          
          // Hide success message after 5 seconds
          setTimeout(() => {
            setPaymentSuccess(null);
          }, 5000);
        },
        // Error handler
        (errorMsg) => {
          console.error('Payment failed:', errorMsg);
          setProcessingPlanId(null);
          setPaymentError(errorMsg);
          
          // Hide error message after 5 seconds
          setTimeout(() => {
            setPaymentError(null);
          }, 5000);
        }
      );
    } catch (error) {
      console.error('Payment process error:', error);
      setProcessingPlanId(null);
      setPaymentError('Failed to initiate payment');
    }
  };

  if (loading) return <div className="p_loading">Loading plans...</div>;
  if (error) return <div className="p_error">{error}</div>;

  return (
    <div className="p_plans-container">
      <h1 className="p_plans-title">Choose Your Plan</h1>
      
      {paymentSuccess && (
        <div className="p_success-message">
          {paymentSuccess.message}
        </div>
      )}
      
      {paymentError && (
        <div className="p_error-message">
          {paymentError}
        </div>
      )}
      
      <div className="p_plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`p_plan-card ${plan.name.toLowerCase().replace(/\//g, '-')}`}>
            <div className="p_plan-header">
              <h2>{plan.name}</h2>
              <div className="p_plan-price">
                <span className="p_amount">${plan.price}</span>
                <span className="p_period">/month</span>
              </div>
            </div>
            <div className="p_plan-features">
              <div className="p_requests">
                <span className="p_number">{plan.requests_per_month}</span>
                <span className="p_label">requests/month</span>
              </div>
              <ul>
                {plan.name === 'Free/Trial' && [
                  <li key="1">Limited requests per month</li>,
                  <li key="2">Basic features</li>,
                  <li key="3">No credit card required</li>
                ]}
                {plan.name === 'Basic' && [
                  <li key="1">Increased monthly requests</li>,
                  <li key="2">Priority support</li>,
                  <li key="3">Advanced features</li>
                ]}
                {plan.name === 'Pro' && [
                  <li key="1">Maximum monthly requests</li>,
                  <li key="2">24/7 Priority support</li>,
                  <li key="3">All premium features</li>,
                  <li key="4">Custom solutions</li>
                ]}
              </ul>
            </div>
            <button 
              className="p_plan-button"
              onClick={() => handlePlanSelect(plan)}
              disabled={processingPlanId === plan.id}
            >
              {processingPlanId === plan.id 
                ? 'Processing...' 
                : (plan.name === 'Free/Trial' ? 'Get Started' : 'Upgrade Now')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plans;