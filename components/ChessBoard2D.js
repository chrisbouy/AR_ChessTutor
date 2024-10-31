import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Square from './Square';

const ChessBoard2D = ({ 
  boardState, 
  boardSize, 
  onSquarePress, 
  selectedSquare, 
  illegalMoveSquares, 
  advisedMove,
  possibleMoves,
 }) => {
const blinkAnimation = useRef(new Animated.Value(0)).current;
const squareSize = boardSize / 9;
// console.log('ChessBoard2D - boardSize:', boardSize);
// console.log('ChessBoard2D - squareSize:', squareSize);

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
const styles = StyleSheet.create({
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: boardSize,
    height: boardSize,
  },
  row: {
    flexDirection: 'row',
  },
  emptyCorner: {
    width: squareSize,
    height: squareSize,
  },
  fileLabel: {
    width: squareSize,
    height: squareSize,
    textAlign: 'center',
    lineHeight: squareSize,
    fontSize: squareSize * .4,
    color: '#fff',
  },
  rankLabel: {
    width: squareSize,
    height: squareSize,
    textAlign: 'center',
    lineHeight: squareSize,
    fontSize: squareSize * .4,
    color: '#fff',
  },
});

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
              squareSize={squareSize}
              possibleMoves={possibleMoves}
            />
          ))}
        </View>
      ))}
    </View>
  );


};
export default ChessBoard2D;
