import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
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

  const rankLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <View style={styles.boardWrapper}>
      <View style={styles.row}>
        <View style={styles.emptyCorner} />
        {fileLabels.map((file, index) => (
          <Text key={index} style={styles.fileLabel}>{file}</Text>
        ))}
      </View>

      {boardState.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          <Text style={styles.rankLabel}>{rankLabels[rowIndex]}</Text>
          {row.map((square, colIndex) => (
            <Square
              key={`${rowIndex}-${colIndex}`}
              square={square}
              onSquarePress={onSquarePress}
              selectedSquare={selectedSquare}
              advisedMove={advisedMove}
              illegalMoveSquares={illegalMoveSquares}
              blinkAnimation={blinkAnimation}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  emptyCorner: {
    width: 45,
    height: 45,
  },
  fileLabel: {
    width: 45,
    height: 45,
    textAlign: 'center',
    lineHeight: 45,
    fontSize: 16,
    color: '#fff',
  },
  rankLabel: {
    width: 45,
    height: 45,
    textAlign: 'center',
    lineHeight: 45,
    fontSize: 16,
    color: '#fff',
  },
});

export default ChessBoard2D;
