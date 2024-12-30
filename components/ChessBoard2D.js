import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Line, Defs, Marker, Path } from 'react-native-svg';
import Square from './Square';
import { ActivityIndicator } from 'react-native';

const ChessBoard2D = ({
  boardState,
  boardSize,
  onSquarePress,
  selectedSquare,
  illegalMoveSquares,
  advisedMove,
  possibleMoves,
  isThinkingMoves,
  recommendedMoves = [],
}) => {
  const blinkAnimation = useRef(new Animated.Value(0)).current;
  const squareSize = boardSize / 9;

  useEffect(() => {
    // console.log('illecalMoveSquares ',illegalMoveSquares);
    if (illegalMoveSquares) {
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
    container: {
      width: boardSize,
      height: boardSize,
    },
    boardWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
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
      fontSize: squareSize * 0.4,
      color: '#fff',
    },
    rankLabel: {
      width: squareSize,
      height: squareSize,
      textAlign: 'center',
      lineHeight: squareSize,
      fontSize: squareSize * 0.4,
      color: '#fff',
    },
    arrowLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: boardSize,
      height: boardSize,
      pointerEvents: 'none',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: boardSize,
      height: boardSize,
      backgroundColor: 'rgba(0, 0, 0, 0)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayText: {
      color: 'white',
      fontSize: 24,
    },
  });

  const getSquareCoordinates = (square) => {
    if (!square || square.length < 2) {
      console.log('Invalid square:', square);
      return { x: 0, y: 0 }; // Return default coordinates
    }
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - parseInt(square[1], 10);

    return {
      x: (file + 1) * squareSize + squareSize / 2,
      y: (rank + 1) * squareSize + squareSize / 2,
    };
  };

  return (
    <View style={styles.container}>
      {/* Chess Board Layer */}
      <View style={styles.boardWrapper}> 
        <View style={styles.row}>
          <View style={styles.emptyCorner} />
          {fileLabels.map((file, index) => (
            <Text key={index} style={styles.fileLabel}>
              {file}
            </Text>
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
                isThinkingMoves={isThinkingMoves}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Arrow Layer */}
      <View style={styles.arrowLayer}>
      {Array.isArray(recommendedMoves) && recommendedMoves.length > 0 && (
        <Svg height={boardSize} width={boardSize}>
          <Defs>
            <Marker
              id="arrowhead"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <Path 
                d="M0,0 L0,4 L4,2 z" 
                fill="red" 
                opacity={.5}
              />
            </Marker>
          </Defs>

          {recommendedMoves.map((arrow, index) => {
            // Determine thickness based on rank (STRONG, STRONGER, STRONGEST)
            // let strokeWidth = 2;
            // if (arrow.rank === 'STRONG') strokeWidth = 2;
            // else if (arrow.rank === 'STRONGER') strokeWidth = 20;
            // else if (arrow.rank === 'STRONGEST') strokeWidth = 4;

// console.log('arrow ', arrow);
// console.log('index ',index);
            return (
              <Line
                key={index}
                x1={getSquareCoordinates(arrow.from).x}
                y1={getSquareCoordinates(arrow.from).y}
                x2={getSquareCoordinates(arrow.to).x}
                y2={getSquareCoordinates(arrow.to).y}
                stroke="red"
                strokeWidth={arrow.arrowSize}
                markerEnd="url(#arrowhead)"
                opacity={.5}
              />
            );
          })}
        </Svg>
      )}
      </View>

      {/* Thinking Overlay */}
      {isThinkingMoves && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

export default ChessBoard2D;
