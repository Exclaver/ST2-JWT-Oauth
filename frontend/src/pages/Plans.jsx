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
    <div className="plans-page">
      <div className="gradient-bg"></div>
      
      <div className="section-header">
        <h2>Choose Your <span className="gradient-text">Plan</span></h2>
        <p>Select the package that fits your needs</p>
      </div>
      
      {paymentSuccess && (
        <div className="success-message">
          {paymentSuccess.message}
        </div>
      )}
      
      {paymentError && (
        <div className="error-message">
          {paymentError}
        </div>
      )}
      
      <div className="plans-container">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.name === 'Pro' ? 'popular' : ''}`}>
            {plan.name === 'Pro' && <div className="popular-tag">Most Popular</div>}
            <h3 className="plan-name">{plan.name}</h3>
            <div className="plan-price">
              <span className="currency">$</span>
              <span className="amount">{plan.price}</span>
              <span className="period">/month</span>
            </div>
            
            <ul className="plan-features">
              <li>
                <svg className="check-icon" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                {plan.requests_per_month} Credits/Month
              </li>
              {plan.name === 'Free/Trial' && [
                <li key="1">
                  <svg className="check-icon" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Advanced Text Extraction
                </li>,
                <li key="2">
                  <svg className="check-icon" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Screenshot Capture
                </li>
              ]}
              {plan.name === 'Basic' && [
                <li key="1">
                  <svg className="check-icon" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Advanced Text Extraction
                </li>,
                
                <li key="2">
                  <svg className="check-icon" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Priority Support
                </li>,
                 <li key="3">
                 <svg className="check-icon" viewBox="0 0 24 24">
                   <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                 </svg>
                 Screenshot Capture
               </li>
              ]}
              {plan.name === 'Pro' && [
  <li key="1">
    <svg className="check-icon" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
    Advanced Text Extraction
  </li>,
  
  <li key="2">
    <svg className="check-icon" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
    24/7 Support
  </li>,
  <li key="3">
  <svg className="check-icon" viewBox="0 0 24 24">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </svg>
  Unlimited Screenshot Capture
</li>,
  <li key="4">
    <svg className="check-icon" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
    Early Access of Upcoming Features
  </li>
]}
            </ul>
            
            <button 
              className={`plan-btn ${plan.name === 'Pro' ? 'plan-btn-popular' : ''}`}
              onClick={() => handlePlanSelect(plan)}
              disabled={processingPlanId === plan.id}
            >
              {processingPlanId === plan.id 
                ? 'Processing...' 
                : (plan.price === 0 ? 'Start Free' : 'Choose Plan')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plans;