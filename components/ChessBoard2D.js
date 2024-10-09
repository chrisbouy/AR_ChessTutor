// ChessBoard2D.js

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Image } from 'react-native';
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
    <View style={styles.container}>
    {/* Letters at the top (files a-h) */}
    <View style={styles.files}>
      {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((letter, index) => (
        <Text key={index} style={styles.fileText}>{letter}</Text>
      ))}
    </View>

    <View style={styles.boardWithRanks}>
      {/* Numbers on the left side (ranks 1-8) */}
      <View style={styles.ranks}>
        {[8, 7, 6, 5, 4, 3, 2, 1].map((number, index) => (
          <Text key={index} style={styles.rankText}>{number}</Text>
        ))}
      </View>
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
      </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  files: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
    backgroundColor: 'black',  // Black background for files labels
  },
  fileText: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',  // White text color for the labels
  },
  boardWithRanks: {
    flexDirection: 'row',
  },
  ranks: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginRight: 5,
    backgroundColor: 'black', // Black background for ranks labels
  },
  rankText: {
    height: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white', // White text color for the labels
  },
  board: {
    flexDirection: 'column',
    borderWidth: 2,
    borderColor: '#000',
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSquare: {
    backgroundColor: '#f3d3a1', // Highlight color
  },
  pieceImage: {
    width: 30,  // Adjust the size as needed
    height: 30, // Adjust the size as needed
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 320,  // Set the appropriate height for the placeholder
    width: 320,   // Set the appropriate width for the placeholder
  },
  loadingText: {
    fontSize: 16,
    color: 'gray',
  },
});

export default ChessBoard2D;