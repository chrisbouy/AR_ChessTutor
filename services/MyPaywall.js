import React, { useEffect } from 'react';
import { Paywall } from 'react-native-purchases-ui';

export const MyPaywall = ({ onClose, onPurchaseSuccess, onPurchaseFailure }) => {
  useEffect(() => {
    const showPaywall = async () => {
      try {
        await Paywall.presentPaywall({
          offering: 'default',
          displayCloseButton: true,
          onDismiss: () => {
            onClose?.();
          },
          onPurchaseCompleted: (customerInfo) => {
            onPurchaseSuccess?.(customerInfo);
          },
          onPurchaseError: (error) => {
            onPurchaseFailure?.(error);
          }
        });
      } catch (error) {
        console.error('Error presenting paywall:', error);
        onPurchaseFailure?.(error);
      }
    };

    showPaywall();

    return () => {
      // No need for dismissPaywall in cleanup
    };
  }, [onClose, onPurchaseSuccess, onPurchaseFailure]);

  return null;
};
