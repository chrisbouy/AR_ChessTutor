// App.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './components/SplashScreen'; // Adjust the path if needed
import ChessTutorApp from './components/ChessTutorApp'; // Your main app component

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="ChessTutorApp" component={ChessTutorApp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
