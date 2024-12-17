import RNIap, {
    purchaseUpdatedListener,
    purchaseErrorListener,
    getAvailablePurchases,
    requestSubscription,
    finishTransaction,
  } from 'react-native-iap';
  
  const productIds = {
    baseApp: 'chess_tutor_base',
    monthlySub: 'chess_tutor_ai_monthly',
    sixMonthSub: 'chess_tutor_ai_six_month',
    yearlySub: 'chess_tutor_ai_yearly',
  };
  
  let hasAIFeature = true;

  export const checkSubscriptionStatus = async () => {
    try {
      // Fetch the subscription status from your backend or storage
      // Simulate with localStorage, AsyncStorage, or a backend call
      const status = await fetchSubscriptionFromServerOrStorage();
      hasAIFeature = status;
      return status;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      hasAIFeature = false;
      return false;
    }
  };
  
  export const subscribeToAI = async (plan) => {
    try {
      // Handle the subscription process (e.g., via Stripe, Apple Pay, etc.)
      const result = await initiateSubscription(plan);
      hasAIFeature = result.success;
      return result.success;
    } catch (error) {
      console.error('Error during subscription:', error);
      return false;
    }
  };
  
  // Export the subscription flag
  export const getHasAIFeature = () => hasAIFeature;
  
  // Example mock function to simulate backend/storage subscription fetching
  const fetchSubscriptionFromServerOrStorage = async () => {
    // Replace with actual backend API or local storage call
    return true; // Simulate an active subscription
  };
  
  // Example mock function to simulate subscription initiation
  const initiateSubscription = async (plan) => {
    // Replace with your payment gateway logic
    console.log(`Subscribing to the ${plan} plan.`);
    return { success: true }; // Simulate successful subscription
  };
  