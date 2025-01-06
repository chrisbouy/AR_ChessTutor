import React from 'react';
import Purchases from 'react-native-purchases';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator, 
  ScrollView,
} from 'react-native';

const SANPopup = ({
  visible,
  description,
  onClose,
  isLoading,
  hasAIFeature,
  reasoningType,
  setShowPaywall
}) => {

  const handleSubscribeClick = () => {
    if (typeof setShowPaywall !== 'function') {
      console.error('setShowPaywall is not a function:', setShowPaywall);
      return;
    }
    onClose();
    setShowPaywall(true);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.popupContainer, { marginBottom: 20 }]}>
              <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {description.split('\n').map((text, index) => (
                  <Text key={index} style={styles.descriptionText}>
                    {text}
                  </Text>
                ))}

                {reasoningType === 'advisedMove' && !hasAIFeature && (
                  <View>
                    <Text style={styles.descriptionText}>
                      Subscribe to unlock detailed move analysis!
                    </Text>
                    <TouchableOpacity 
                      style={styles.subscribeButton}
                      onPress={handleSubscribeClick}
                    >
                      <Text style={styles.subscribeButtonText}>Subscribe to Unlock</Text>
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
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  subscribeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 15,
    marginBottom: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // elevation: 5,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end', 
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
    // maxHeight: 300, // Limit height so ScrollView can scroll if content exceeds
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
});

export default SANPopup;
