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

const Square = ({ square, 
  onSquarePress, 
  selectedSquare, 
  advisedMove, 
  illegalMoveSquares, 
  squareSize, 
  blinkAnimation,
  possibleMoves,
 }) => {
  if (!square) return null;
  const styles = StyleSheet.create({
    square: {
      position: 'relative',
      width: squareSize,
      height: squareSize,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pieceImage: {
      width: squareSize * .9,
      height: squareSize * .9,
      resizeMode: 'contain',
    },
    shadow: {
      borderWidth: 2,
      borderColor: 'yellow',
    },
    possibleMoveIndicator: {
      position: 'absolute',
      width: squareSize * 0.3,
      height: squareSize * 0.3,
      borderRadius: squareSize * 0.15,
      backgroundColor: 'rgba(0, 255, 0, 0.5)', // Semi-transparent green
      alignSelf: 'center',
      top: squareSize * 0.35,
    },
  });
  const isSelected = selectedSquare === square.position;
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
    backgroundColor = blinkAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [square.color, 'rgba(255, 0, 0, 0.8)'], // Red blink for illegal move
    });
  }

//   if (isAdvisedFromSquare || isAdvisedToSquare) {
// //backgroundColor = 'rgba(0, 255, 0, 1)'; // Green background for advised move
//     shadowStyle = styles.shadow; 
//   }

  const pieceImage = getPieceImage(square.piece);

  return (
    <TouchableOpacity onPress={() => onSquarePress(square.position)}>
      <Animated.View style={[styles.square, { backgroundColor }, shadowStyle]}>
        {pieceImage && <Image source={pieceImage} style={styles.pieceImage} />}
        {isPossibleMove && <View style={styles.possibleMoveIndicator} />}
      </Animated.View>
    </TouchableOpacity>
  );



};
export default Square;
