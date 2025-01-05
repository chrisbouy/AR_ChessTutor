import React, { useEffect } from 'react';
import RevenueCatUI from 'react-native-purchases-ui';

export const MyPaywall = ({ onClose, onPurchaseSuccess, onPurchaseFailure }) => {
  useEffect(() => {
    RevenueCatUI.presentPaywall({
      offering: 'default',
      displayCloseButton: true,
      onDismiss: () => {
        onClose?.(); // Call the onClose callback when paywall is dismissed
      },
      onPurchaseCompleted: (customerInfo) => {
        onPurchaseSuccess?.(customerInfo);
      },
      onPurchaseError: (error) => {
        onPurchaseFailure?.(error);
      }
    })
    .catch((error) => {
      console.error('Error presenting paywall:', error);
      onPurchaseFailure?.(error);
    });

    return () => {
      // Cleanup by dismissing the paywall when component unmounts
      RevenueCatUI.dismissPaywall();
    };
  }, [onClose, onPurchaseSuccess, onPurchaseFailure]); // Add callbacks to dependency array

  return null;
};
