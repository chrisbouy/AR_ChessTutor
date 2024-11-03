import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Line, Defs, Marker, Path } from 'react-native-svg';
import Square from './Square';

const ChessBoard2D = ({
  boardState,
  boardSize,
  onSquarePress,
  selectedSquare,
  illegalMoveSquares,
  advisedMove,
  possibleMoves,
  isThinking,
  recommendedMoves,
}) => {
  const blinkAnimation = useRef(new Animated.Value(0)).current;
  const squareSize = boardSize / 9;

  useEffect(() => {
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayText: {
      color: 'white',
      fontSize: 24,
    },
  });

  const getSquareCoordinates = (square) => {
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
                isThinking={isThinking}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Arrow Layer */}
      <View style={styles.arrowLayer}>
        <Svg height={boardSize} width={boardSize}>
          <Defs>
            <Marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <Path d="M0,0 L0,7 L10,3.5 z" fill="red" />
            </Marker>
          </Defs>
          {recommendedMoves &&
            recommendedMoves.map((move, index) => {
              const fromCoords = getSquareCoordinates(move.from);
              const toCoords = getSquareCoordinates(move.to);

              // Determine arrow style based on priority
              let strokeOpacity = 1;
              let strokeWidth = 3;

              switch (move.priority) {
                case 'FORCED':
                  strokeOpacity = 1;
                  strokeWidth = 4;
                  break;
                case 'STRONG':
                  strokeOpacity = 0.7;
                  strokeWidth = 3;
                  break;
                case 'OPTIONAL':
                  strokeOpacity = 0.4;
                  strokeWidth = 2;
                  break;
                default:
                  strokeOpacity = 1;
                  strokeWidth = 3;
              }

              return (
                <Line
                  key={index}
                  x1={fromCoords.x}
                  y1={fromCoords.y}
                  x2={toCoords.x}
                  y2={toCoords.y}
                  stroke="red"
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
        </Svg>
      </View>

      {/* Thinking Overlay */}
      {isThinking && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayText}>Thinking...</Text>
        </View>
      )}
    </View>
  );
};

export default ChessBoard2D;
