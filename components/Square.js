import React from 'react';
import { TouchableOpacity, View, StyleSheet, Image, Animated } from 'react-native';

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

const Square = ({ square, onSquarePress, selectedSquare, advisedMove, illegalMoveSquares, blinkAnimation }) => {
  if (!square) return null;

  const isSelected = selectedSquare === square.position;
  const isAdvisedFromSquare = advisedMove?.from === square.position;
  const isAdvisedToSquare = advisedMove?.to === square.position;
  const isIllegalFromSquare = illegalMoveSquares?.from === square.position;
  const isIllegalToSquare = illegalMoveSquares?.to === square.position;

  let backgroundColor = square.color;
   let shadowStyle = {};  // Define an empty box shadow style

  if (isSelected && !isAdvisedFromSquare && !isAdvisedToSquare) {
    backgroundColor = '#ffff00'; // Yellow highlight for selected square (if not green)
    shadowStyle = styles.shadow; // Apply shadow for selected square
  }

  if (isIllegalFromSquare || isIllegalToSquare) {
    backgroundColor = blinkAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [square.color, 'rgba(255, 0, 0, 0.8)'], // Red blink for illegal move
    });
  }

  if (isAdvisedFromSquare || isAdvisedToSquare) {
//backgroundColor = 'rgba(0, 255, 0, 1)'; // Green background for advised move
    shadowStyle = styles.shadow; 
  }

  const pieceImage = getPieceImage(square.piece);

  return (
    <TouchableOpacity onPress={() => onSquarePress(square.position)}>
      <Animated.View style={[styles.square, { backgroundColor }, shadowStyle]}>
        {pieceImage && <Image source={pieceImage} style={styles.pieceImage} />}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  square: {
    position: 'relative',
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  shadow: {
    position: 'relative',
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#FFF', // Ensure solid background
    shadowColor: 'white', // Green shadow
    shadowOffset: { width: 0, height: 0 }, // Apply shadow evenly around the square
    shadowOpacity: 1, // Control shadow opacity
    shadowRadius: 15, // Control shadow spread
    elevation: 10, // Elevation for Android
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0.8,
    // shadowRadius: 10,
    // elevation: 10, // Android shadow
  },
});

export default Square;
