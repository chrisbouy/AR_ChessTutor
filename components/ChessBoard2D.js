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
              markerWidth="15"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <Path d="M0,0 L0,7 L10,3.5 z" fill="red" fillOpacity="1.0" />
            </Marker>

            {/* Marker for opacity 0.8 */}
            <Marker
              id="arrowheadOpacity0_8"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <Path d="M0,0 L0,7 L10,3.5 z" fill="red" fillOpacity="0.8" />
            </Marker>

            {/* Marker for opacity 0.4 */}
            <Marker
              id="arrowheadOpacity0_4"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <Path d="M0,0 L0,7 L10,3.5 z" fill="red" fillOpacity="0.4" />
            </Marker>
          </Defs>
          
          {recommendedMoves.map((move, index) => {
            if (!move.from || !move.to) {
              console.log('Recommended Moves:', recommendedMoves);
              console.log('Invalid moove:', move);
              return null; 
            }
            const fromCoords = getSquareCoordinates(move.from);
            const toCoords = getSquareCoordinates(move.to);
            let strokeOpacity = move.arrowOpacity !== undefined ? move.arrowOpacity : 1.0;
            let strokeWidth =4; 
            
            // Determine the marker id based on strokeOpacity
            let markerId = '';
            if (strokeOpacity === 1.0) {
              markerId = 'url(#arrowheadOpacity1)';
            } else if (strokeOpacity === 0.8) {
              markerId = 'url(#arrowheadOpacity0_8)';
            } else if (strokeOpacity === 0.1) {
              markerId = 'url(#arrowheadOpacity0_4)';
            } else {
              // For any other opacity, default to opacity 1
              markerId = 'url(#arrowheadOpacity1)';
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
                markerEnd={markerId}
              />
            );
          })}
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
