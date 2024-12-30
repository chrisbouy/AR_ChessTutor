import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = {
  ios: 'appl_ZYZlsZPIzNRKrAIugabnNamcJty',
  android: 'YOUR_ANDROID_KEY'
};

export const initializePurchases = async () => {
  try {
    const platform = Platform.OS;
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY[platform] });
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
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
