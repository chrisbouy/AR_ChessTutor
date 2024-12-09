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
  isThinking,
  recommendedMoves = [],
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
                isThinking={isThinking}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Arrow Layer */}
      <View style={styles.arrowLayer}>
      {/* Check if recommendedMoves is a non-empty array */}
      {Array.isArray(recommendedMoves) && recommendedMoves.length > 0 && (
        <Svg height={boardSize} width={boardSize}>
          <Defs>
            {/* Marker for opacity 1.0 */}
            <Marker
  id="arrowheadOpacity1"
  markerWidth="4" // Smaller width
  markerHeight="4" // Smaller height
  refX="2" // Adjust this to align with the line
  refY="2"
  orient="auto"
  markerUnits="strokeWidth"
>
  <Path d="M0,0 L0,4 L4,2 z" fill="red" fillOpacity="1.0" />
</Marker>

            {/* Marker for opacity 0.8 */}
            <Marker
  id="arrowheadOpacity0_8"
  markerWidth="4"
  markerHeight="4"
  refX="2"
  refY="2"
  orient="auto"
  markerUnits="strokeWidth"
>
  <Path d="M0,0 L0,4 L4,2 z" fill="red" fillOpacity="0.8" />
</Marker>


            {/* Marker for opacity 0.4 */}
            <Marker
  id="arrowheadOpacity0_4"
  markerWidth="4"
  markerHeight="4"
  refX="2"
  refY="2"
  orient="auto"
  markerUnits="strokeWidth"
>
  <Path d="M0,0 L0,4 L4,2 z" fill="red" fillOpacity="0.4" />
</Marker>
          </Defs>
   {/* Render arrows */}
   {recommendedMoves.map((arrow, index) => (
        <Line
          key={index}
          x1={getSquareCoordinates(arrow.from).x}
          y1={getSquareCoordinates(arrow.from).y}
          x2={getSquareCoordinates(arrow.to).x}
          y2={getSquareCoordinates(arrow.to).y}
          stroke="red"
          strokeWidth={2} // Adjust thickness as needed
          strokeOpacity={arrow.arrowOpacity}
          markerEnd="url(#arrowheadOpacity1)"
        />
      ))}
        </Svg>
      )}
      </View>
      {/* Thinking Overlay */}
      {isThinking && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

export default ChessBoard2D;
