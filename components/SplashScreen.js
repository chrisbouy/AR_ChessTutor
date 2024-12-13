import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SplashScreen from 'react-native-splash-screen';

const SplashScreenComponent = () => {
  useEffect(() => {
    // Simulate loading process (e.g., fetching data or initializing app)
    setTimeout(() => {
      SplashScreen.hide(); // Hides the native splash screen
    }, 2000); // Adjust timing as needed
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to ChessTutor!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191d24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 20,
  },
});

export default SplashScreenComponent;
