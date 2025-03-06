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
  console.log('[DEBUG] processPayment started with planId:', planId);
  try {
    // Load Razorpay script
    console.log('[DEBUG] Attempting to load Razorpay script');
    const scriptLoaded = await loadRazorpay();
    console.log('[DEBUG] loadRazorpay result:', scriptLoaded);
    
    if (!scriptLoaded) {
      console.error('[DEBUG] Razorpay script failed to load');
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }
    
    // Create order on server
    console.log('[DEBUG] Creating order on server for planId:', planId);
    const orderData = await paymentAPI.createOrder(planId);
    console.log('[DEBUG] Order created successfully:', orderData);
    
    // Configure Razorpay options
    console.log('[DEBUG] Configuring Razorpay options');
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Textify",
      description: "Plan Subscription",
      order_id: orderData.order_id,
      handler: async function (response) {
        // Verify payment on serve
        console.log('[DEBUG] Razorpay payment response:', response);
        try {
          console.log('[DEBUG] Verifying payment...');
          const result = await paymentAPI.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
          console.log('[DEBUG] Payment verification successful:', result);
          onSuccess(result);
        } catch (err) {
          console.error('[DEBUG] Payment verification failed:', err);
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
          console.log('[DEBUG] Payment modal dismissed by user');
        }
      }
    };
    console.log('[DEBUG] Razorpay options configured:', JSON.stringify(options, null, 2));
    
    // Open Razorpay checkout
    console.log('[DEBUG] Creating Razorpay instance');
    const razorpay = new window.Razorpay(options);
    console.log('[DEBUG] Razorpay instance created:', razorpay);
    console.log('[DEBUG] Attempting to open Razorpay checkout modal');
    razorpay.open();
    console.log('[DEBUG] Razorpay.open() called');
    
  } catch (err) {
    console.error('[DEBUG] Error in processPayment:', err);
    if (err.response) {
      console.error('[DEBUG] Error response data:', err.response.data);
      console.error('[DEBUG] Error response status:', err.response.status);
    } else {
      console.error('[DEBUG] Error details:', err.message || 'No error message');
    }
    onError(err.response?.data?.error || 'Failed to initiate payment');
  }
};