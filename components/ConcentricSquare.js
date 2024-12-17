import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const ConcentricSquare = ({ size, color }) => {
  // Check if the square is dark
  const isDarkSquare = color === '#1324a8';

  return (
    <View style={{ width: size, height: size, backgroundColor: color }}>
      {isDarkSquare && (
        <Svg width="100%" height="100%">
          <Rect x="0" y="0" width="100%" height="100%" fill="none" stroke="#444" strokeWidth="1" />
          <Rect x="5" y="5" width="90%" height="90%" fill="none" stroke="#666" strokeWidth="1" />
          <Rect x="10" y="10" width="80%" height="80%" fill="none" stroke="#888" strokeWidth="1" />
        </Svg>
      )}
    </View>
  );
};

export default ConcentricSquare;