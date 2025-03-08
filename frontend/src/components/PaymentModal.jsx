import React, { useState } from 'react';
import { paymentAPI } from '../api';
import { openRazorpayCheckout } from '../utils/razorpay';
import '../styles/PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, plan, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  if (!isOpen) return null;
  
  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);    
      // Create order on server
      const orderData = await paymentAPI.createOrder(plan.id);
      // Open Razorpay checkout
      openRazorpayCheckout(
        orderData,
        async (response) => {
          try {
            // Verify payment on server
            const result = await paymentAPI.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            
            setLoading(false);
            onSuccess(result);
            onClose();
          } catch (err) {
            setError('Payment verification failed');
            setLoading(false);
          }
        },
        () => {
          setError('Payment failed');
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate payment');
      setLoading(false);
    }
  };
  
  return (
    <div className="payment-modal">
      <div className="payment-modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Upgrade to {plan.name}</h2>
        
        <div className="plan-details">
          <p>Price: ${plan.price}</p>
          <p>Credits: {plan.requests_per_month}</p>
          <p>Valid for: 30 days</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="payment-actions">
          <button 
            className="pay-button" 
            onClick={handlePayment} 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;