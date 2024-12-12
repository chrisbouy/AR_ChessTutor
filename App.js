// App.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './components/SplashScreen'; // Adjust the path if needed
import ChessTutorApp from './components/ChessTutorApp'; // Your main app component
import { LogBox } from 'react-native';





const Stack = createStackNavigator();

export default function App() {
  LogBox.ignoreLogs([
    'RCTImageView has a shadow set',
  ]);

  
  
  // useEffect(() => {
  //   // Simulate a delay to showcase the splash screen
  //   setTimeout(() => {
  //     SplashScreen.hide();
  //   }, 2000); // 2-second delay
  // }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="ChessTutorApp" component={ChessTutorApp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
