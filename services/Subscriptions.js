import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);

const REVENUECAT_API_KEY = {
  ios: 'appl_ZYZlsZPIzNRKrAIugabnNamcJty',
  android: 'YOUR_ANDROID_KEY'
};

export const initializePurchases = async () => {
  try {
    const platform = Platform.OS;
    
     Purchases.configure({ apiKey: REVENUECAT_API_KEY[platform] });
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
  Purchases.getOfferings()
  .then(offerings => {
    console.log('RevenueCat Offerings:', offerings);
    if (offerings.current === null) {
      console.log('No current offering found');
    }
  })
  .catch(error => {
    console.error('RevenueCat Error:', error);
  });
};

export const checkSubscriptionStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    // Check if user has active subscription
    return customerInfo.activeSubscriptions.length > 0;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.activeSubscriptions.length > 0;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};
