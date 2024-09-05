import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChessBoard3D = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>3D Chessboard will go here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd', // Placeholder background
    borderWidth: 2,
    borderColor: '#000',
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
});

export default ChessBoard3D;
