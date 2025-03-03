import { paymentAPI } from '../api';
/**
 * Handles Razorpay payment flow directly
 */

// Load the Razorpay script dynamically
export const loadRazorpay = () => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log("Razorpay already loaded");
      return resolve(true);
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.defer = true;
    
    // Add timeout
    const timeout = setTimeout(() => {
      reject(new Error("Razorpay script loading timed out"));
    }, 10000); // 10 seconds timeout
    
    // Define onload only once
    script.onload = () => {
      clearTimeout(timeout);
      console.log("Razorpay script loaded successfully");
      resolve(true);
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      console.error("Failed to load Razorpay script");
      reject(new Error("Failed to load Razorpay script"));
    };
    
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
      name: "Textify",
      description: "Plan Subscription",
      order_id: orderData.order_id,
      handler: async function (response) {
        // Verify payment on serve
        console.log('Razorpay payment response:', response);
        try {
          console.log('Verifying payment...');
          const result = await paymentAPI.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
          console.log('Payment verification successful:', result);
          onSuccess(result);
        } catch (err) {
          console.error('Payment verification failed:', err);
          onError(err.response?.data?.error || 'Payment verification failed');
        }
      },
      prefill: {
        name: orderData.user_name || '',
        email: orderData.user_email || '',
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