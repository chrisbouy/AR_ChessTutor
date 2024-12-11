import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const NavigationArrows = ({
  onBackPress,
  onForwardPress,
  disableBack,
  disableForward,
}) => {
  return (
    <View style={styles.navigationContainer}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={onBackPress}
        disabled={disableBack}
        style={[styles.arrowButton, disableBack && styles.disabledButton]}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={disableBack ? '#888' : '#fff'}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Forward Button */}
      <TouchableOpacity
        onPress={onForwardPress}
        disabled={disableForward}
        style={[styles.arrowButton, disableForward && styles.disabledButton]}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path
            d="M9 18l6-6-6-6"
            stroke={disableForward ? '#888' : '#fff'}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  arrowButton: {
    padding: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default NavigationArrows;
