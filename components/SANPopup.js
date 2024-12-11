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

const SANPopup = ({ visible, description, onClose, isLoading }) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.popupContainer}>
              {description.split('\n').map((text, index) => (
                <Text key={index} style={styles.descriptionText}>
                  {text}
                </Text>
              ))}
              {isLoading && (
                <ActivityIndicator
                  size="large"
                  color="#ffffff"
                  style={styles.popupSpinner}
                />
              )}
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.popupCloseText}>Close</Text>
              </TouchableOpacity>
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
