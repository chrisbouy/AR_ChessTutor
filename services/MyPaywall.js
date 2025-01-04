import React, { useEffect } from 'react';
import RevenueCatUI from 'react-native-purchases-ui';

export const MyPaywall = ({ onClose, onPurchaseSuccess, onPurchaseFailure }) => {
  useEffect(() => {
    RevenueCatUI.presentPaywall({
      offering: 'default',
      displayCloseButton: true
    })
    .then(() => {
      // Paywall presented successfully
    })
    .catch((error) => {
      console.error('Error presenting paywall:', error);
      onPurchaseFailure?.(error);
    });

    // Return cleanup function
    return () => {
      // Handle cleanup if needed
    };
  }, []); // Empty dependency array means this runs once when component mounts

  return null; // No need to render anything since we're using presentPaywall
};
