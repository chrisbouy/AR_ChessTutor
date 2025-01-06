import React, { useEffect } from 'react';
import ChessTutorApp from './components/ChessTutorApp';
import SplashScreen from 'react-native-splash-screen';
// import { LogBox } from 'react-native';

// // Only ignore specific warnings
// LogBox.ignoreLogs([
//   'shadow',
//   'Shadow props are not supported',
//   // Add other specific warnings here if needed
// ]);

// Remove or comment out this line to see console logs
// LogBox.ignoreAllLogs();

export default function App() {
  useEffect(() => {
    let timeoutId;
    const hideSplash = async () => {
      try {
        // Wait for ChessTutorApp to mount and initialize
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, 1500);
        });
        
        if (SplashScreen) {
          console.log('Attempting to hide splash screen...');
          SplashScreen.hide();
        } else {
          console.error('SplashScreen is not defined');
        }
      } catch (error) {
        console.error('Failed to hide splash screen:', error);
        // Attempt to hide again after a short delay
        setTimeout(() => {
          try {
            SplashScreen.hide();
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }, 500);
      }
    };

    hideSplash();

    // Cleanup timeout if component unmounts
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return <ChessTutorApp />;
}
