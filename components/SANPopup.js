import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';

const SANPopup = ({ visible, description, onClose }) => {
    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.popupContainer}>
                            {description.split('\n').map((text, index) => (
                                <Text key={index} style={styles.descriptionText}>{text}</Text>
                            ))}                        
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
        justifyContent: 'flex-start', // Start from the top
        alignItems: 'center',
        paddingTop: 630, // Adjust to position the popup 30 pixels below the board
        backgroundColor: 'rgba(0, 0, 0, 0.5)' // Semi-transparent overlay
    },
    popupContainer: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 20,
        marginHorizontal: 20,
    },
    descriptionText: {
        fontSize: 18, // Larger font size
        color: 'white',
        textAlign: 'center',
        marginBottom: 5,
    },
});

export default SANPopup;
