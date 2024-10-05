// ChessBoard2D.js

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Square from './Square';

const ChessBoard2D = ({ boardState, onSquarePress, selectedSquare, illegalMoveSquares, advisedMove }) => {
  const blinkAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (illegalMoveSquares) {
      // Blink red for illegal move squares
      Animated.sequence([
        Animated.timing(blinkAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(blinkAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [illegalMoveSquares]);

  return (
    <View style={styles.board}>
      {boardState.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((square, colIndex) => (
            <Square
              key={`${rowIndex}-${colIndex}`}
              square={square}
              onSquarePress={onSquarePress}
              selectedSquare={selectedSquare} // Pass selected square for yellow highlight
              advisedMove={advisedMove} // Pass advised move for green highlight
              illegalMoveSquares={illegalMoveSquares} // Pass illegal move squares for red blink
              blinkAnimation={blinkAnimation} // Pass blink animation
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    flexDirection: 'column',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});

export default ChessBoard2D;
