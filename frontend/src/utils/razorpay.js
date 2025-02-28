import { paymentAPI } from '../api';
/**
 * Handles Razorpay payment flow directly
 */

// Load the Razorpay script dynamically
export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Open Razorpay checkout directly
export const processPayment = async (planId, onSuccess, onError) => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpay();
    
    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }
    
    // Create order on server
    const orderData = await paymentAPI.createOrder(planId);
    
    // Configure Razorpay options
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Your Website Name",
      description: "Plan Subscription",
      order_id: orderData.order_id,
      handler: async function (response) {
        // Verify payment on server
        try {
          const result = await paymentAPI.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
          
          onSuccess(result);
        } catch (err) {
          onError(err.response?.data?.error || 'Payment verification failed');
        }
      },
      prefill: {
        name: "",
        email: "",
        contact: ""
      },
      theme: {
        color: "#6200ea"
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled by user');
        }
      }
    };
    
    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);
    razorpay.open();
    
  } catch (err) {
    onError(err.response?.data?.error || 'Failed to initiate payment');
  }
};