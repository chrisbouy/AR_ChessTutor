import React from 'react';
import { TouchableOpacity, View, StyleSheet, Image, Animated } from 'react-native';
import Svg, { Rect } from 'react-native-svg'; // Import for SVG drawing

// Import your chess piece images here
import whiteRook from '../assets/images/2d_chess_pieces/white-rook.png';
import blackRook from '../assets/images/2d_chess_pieces/black-rook.png';
import whiteKnight from '../assets/images/2d_chess_pieces/white-knight.png';
import blackKnight from '../assets/images/2d_chess_pieces/black-knight.png';
import whiteBishop from '../assets/images/2d_chess_pieces/white-bishop.png';
import blackBishop from '../assets/images/2d_chess_pieces/black-bishop.png';
import whiteKing from '../assets/images/2d_chess_pieces/white-king.png';
import blackKing from '../assets/images/2d_chess_pieces/black-king.png';
import whiteQueen from '../assets/images/2d_chess_pieces/white-queen.png';
import blackQueen from '../assets/images/2d_chess_pieces/black-queen.png';
import whitePawn from '../assets/images/2d_chess_pieces/white-pawn.png';
import blackPawn from '../assets/images/2d_chess_pieces/black-pawn.png';

const getPieceImage = (piece) => {
  if (!piece) return null;

  const pieceMap = {
    wR: whiteRook,
    bR: blackRook,
    wN: whiteKnight,
    bN: blackKnight,
    wB: whiteBishop,
    bB: blackBishop,
    wQ: whiteQueen,
    bQ: blackQueen,
    wK: whiteKing,
    bK: blackKing,
    wP: whitePawn,
    bP: blackPawn,
  };

  return pieceMap[`${piece.color}${piece.type.toUpperCase()}`];
};

const Square = ({ square, 
  onSquarePress, 
  selectedSquare, 
  advisedMove, 
  illegalMoveSquares, 
  squareSize, 
  blinkAnimation,
  possibleMoves,
  isThinkingMoves,
 }) => {
  if (!square) return null;
        
  const isDarkSquare = square.color === '#080100'; // Assuming dark square color
  const isSelected = selectedSquare === square.position;

  const isIllegalMove = illegalMoveSquares === square.position;

  const styles = StyleSheet.create({
    square: {
      position: 'relative',
      width: squareSize,
      height: squareSize,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isIllegalMove
      ? 'rgba(255, 0, 0, 0.8)' // Red flash for illegal moves
      : square.color,
    },
    pieceContainer: {
      width: squareSize * 0.9,
      height: squareSize * 0.9,
      justifyContent: 'center', 
      alignItems: 'center',
      shadowColor:'#FFFFFF', // Black for white pieces, white for black
      shadowOpacity: 1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 5, // Android support

    },
    pieceImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    possibleMoveIndicator: {
      position: 'absolute',
      width: squareSize * 0.3,
      height: squareSize * 0.3,
      borderRadius: squareSize * 0.15,
      backgroundColor: 'rgba(0, 255, 0, 0.5)',
      alignSelf: 'center',
      top: squareSize * 0.35,
    },
    glowEffect: {
      shadowColor: '#FFFFFF', // Black glow for white pieces, white glow for black pieces
      shadowOpacity: 1,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 0 },
      elevation: 5, // Android equivalent of shadow
    },
    glowEffect2: {
      shadowColor: '#FFFFFF', // Black glow for white pieces, white glow for black pieces
      shadowOpacity: 1,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 0 },
      elevation: 5, // Android equivalent of shadow
    }
  });
  //  const isSelected = selectedSquare === square.position;
  const pieceImage = getPieceImage(square.piece);

  const isAdvisedFromSquare = advisedMove?.from === square.position;
  const isAdvisedToSquare = advisedMove?.to === square.position;
  const isIllegalFromSquare = illegalMoveSquares?.from === square.position;
  const isIllegalToSquare = illegalMoveSquares?.to === square.position;
  const isPossibleMove = possibleMoves && possibleMoves.includes(square.position);

  let backgroundColor = square.color;
   let shadowStyle = {};  // Define an empty box shadow style

  if (isSelected) {
    backgroundColor = '#ffeb3b'; // Yellow highlight for selected square (if not green)
    shadowStyle = {
      borderWidth: 2,
      borderColor: 'yellow',
    };  }

  if (isIllegalFromSquare || isIllegalToSquare) {
    console.log('square ', isIllegalFromSquare);
    
    // backgroundColor = blinkAnimation.interpolate({
    //   inputRange: [0, 1],
    //   outputRange: [square.color, 'rgba(255, 0, 0, 0.8)'], // Red blink for illegal move
    // });
    // blinkAnimation.addListener(({ value }) => console.log('Blink Animation Value:', value));

  }

//   if (isAdvisedFromSquare || isAdvisedToSquare) {
// backgroundColor = 'rgba(0, 255, 0, 1)'; // Green background for advised move
//     shadowStyle = styles.shadow; 
//   }


  return (
    <TouchableOpacity 
    onPress={() => onSquarePress(square.position)}
    disabled={isThinkingMoves}
    >
       <Animated.View style={[styles.square,styles.glowEffect2, { backgroundColor: square.color }, shadowStyle]}>
        {/* Render concentric squares only on dark squares */}
        {isDarkSquare && (
        <Svg
            width={squareSize}
            height={squareSize}
            viewBox={`0 0 ${squareSize} ${squareSize}`} // Match size for scaling
            style={{ position: 'absolute', top: 0, left: 0 }} // Correct positioning
          >
            <Rect
              x={squareSize * 0.1}
              y={squareSize * 0.1}
              width={squareSize * 0.8}
              height={squareSize * 0.8}
              fill="none"
              stroke="#888"
              strokeWidth="1"
            />
            <Rect
              x={squareSize * 0.2}
              y={squareSize * 0.2}
              width={squareSize * 0.6}
              height={squareSize * 0.6}
              fill="none"
              stroke="#888"
              strokeWidth="1"
            />
            <Rect
              x={squareSize * 0.3}
              y={squareSize * 0.3}
              width={squareSize * 0.4}
              height={squareSize * 0.4}
              fill="none"
              stroke="#888"
              strokeWidth="1"
            />
            <Rect
              x={squareSize * 0.4}
              y={squareSize * 0.4}
              width={squareSize * 0.2}
              height={squareSize * 0.2}
              fill="none"
              stroke="#888"
              strokeWidth="1"
            />   
          </Svg>
                )}

        {/* Render chess piece */}
        <View style={styles.pieceContainer}>
          {pieceImage && <Image source={pieceImage} style={[styles.pieceImage, styles.glowEffect]} />}
        </View>

        {/* Highlight possible move */}
        {possibleMoves?.includes(square.position) && (
          <View style={styles.possibleMoveIndicator} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );



};
export default Square;
