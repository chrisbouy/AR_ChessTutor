import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

export const MyPaywall = ({ onClose, onPurchaseSuccess, onPurchaseFailure }) => {
  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        style={styles.paywall}
        offering="default"
        displayCloseButton={true}
        onClose={onClose}
        onPurchaseCompleted={onPurchaseSuccess}
        onPurchaseError={onPurchaseFailure}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#191d24',
  },
  paywall: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});
