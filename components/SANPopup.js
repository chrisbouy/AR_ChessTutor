import React from 'react';
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
  openSystemSubscriptionPage,
}) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.popupContainer, { marginBottom: 20 }]}>
              <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Always show the description */}
                {description.split('\n').map((text, index) => (
                  <Text key={index} style={styles.descriptionText}>
                    {text}
                  </Text>
                ))}

                {/* Show subscription prompt for advised moves if AI is locked */}
                {reasoningType === 'advisedMove' && !hasAIFeature && (
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
              </ScrollView>
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
