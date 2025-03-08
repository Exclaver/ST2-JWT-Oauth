import { paymentAPI } from '../api';

export const loadRazorpay = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.defer = true;
    
    const timeout = setTimeout(() => {
      reject(new Error("Razorpay script loading timed out"));
    }, 10000);
    
    script.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to load Razorpay script"));
    };
    
    document.body.appendChild(script);
  });
};

export const processPayment = async (planId, onSuccess, onError) => {
  try {
    const scriptLoaded = await loadRazorpay();
    
    if (!scriptLoaded) {
      throw new Error('Razorpay SDK failed to load');
    }
    
    const orderData = await paymentAPI.createOrder(planId);
    
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Textify",
      description: "Plan Subscription",
      order_id: orderData.order_id,
      handler: async function (response) {
        try {
          const result = await paymentAPI.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
          onSuccess(result);
        } catch (error) {
          onError(error.response?.data?.error || 'Payment verification failed');
        }
      },
      prefill: {
        name: orderData.user_name || '',
        email: orderData.user_email || '',
      },
      theme: {
        color: "#000000"
      },
      modal: {
        ondismiss: () => onError('Payment cancelled by user')
      }
    };
    
    const razorpay = new window.Razorpay(options);
    razorpay.open();
    
  } catch (error) {
    onError(error.response?.data?.error || error.message || 'Failed to initiate payment');
  }
};