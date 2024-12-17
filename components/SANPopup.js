import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator, 
} from 'react-native';

const SANPopup = ({ visible, description, onClose, isLoading, hasAIFeature,   openSystemSubscriptionPage,}) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.popupContainer}>
              {hasAIFeature ? (
                description.split('\n').map((text, index) => (
                    <Text key={index} style={styles.descriptionText}>{text}</Text>
                ))   
              ) : (
              <View>
                  <Text style={styles.descriptionText}>
                      Subscribe to unlock detailed move analysis!
                  </Text>
                  <TouchableOpacity onPress={openSystemSubscriptionPage}>
                      <Text style={styles.subscribeButton}>Subscribe Now</Text>
                  </TouchableOpacity>
              </View>
              )}
              {isLoading && (
                <ActivityIndicator
                  size="large"
                  color="#ffffff"
                  style={styles.popupSpinner}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 630,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  descriptionText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  popupSpinner: {
    marginTop: 20,
    alignSelf: 'center',
  },
  popupContainer: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
},
  popupCloseText: {
    marginTop: 10,
    color: '#aec4e8',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default SANPopup;
