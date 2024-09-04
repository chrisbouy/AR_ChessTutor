import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
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

// Continue importing other pieces

// Continue importing other pieces


const ChessBoard = ({ boardState, onPieceSelect, onMove }) => {
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);

  const handleSquareClick = (row, col) => {
    const square = getSquareFromCoordinates(row, col);
    const piece = boardState[row][col];

    if (!selectedPiece) {
      if (piece) {
        setSelectedPiece(piece);
        setSelectedSquare(square);
        console.log(`Selected piece: ${piece.type} at ${square}`);
      }
    } else {
      const moveResult = onMove(selectedSquare, square);
      if (moveResult) {
        console.log("Move made:", moveResult);
        setSelectedPiece(null); // Deselect the piece after moving
        setSelectedSquare(null);
      } else {
        alert("Invalid move");
        setSelectedPiece(null); // Deselect the piece on invalid move
        setSelectedSquare(null);
      }
    }
  };

  const getPieceImage = (piece) => {
    if (!piece) return null;
  
    const pieceMap = {
      'wR': whiteRook,
      'bR': blackRook,
      'wN': whiteKnight,
      'bN': blackKnight,
      'wB': whiteBishop,
      'bB': blackBishop,
      'wK': whiteKing,
      'bK': blackKing,
      'wQ': whiteQueen,
      'bQ': blackQueen,
      'wP': whitePawn,
      'bP': blackPawn,
      // Add mappings for all pieces
    };
  
    return pieceMap[`${piece.color}${piece.type.toUpperCase()}`];
  };
  
  

  return (
    <View style={styles.board}>
      {boardState.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((piece, colIndex) => (
            <TouchableOpacity
              key={`${rowIndex}-${colIndex}`}
              style={[
                styles.square,
                { backgroundColor: getSquareColor(rowIndex, colIndex) },
                selectedSquare === getSquareFromCoordinates(rowIndex, colIndex) && styles.selectedSquare, // Highlight selected square
              ]}
              onPress={() => handleSquareClick(rowIndex, colIndex)}
            >
              {piece && (
                <Image
                  source={getPieceImage(piece)}
                  style={styles.pieceImage} // Style the image for proper sizing
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

const getSquareColor = (row, col) => {
  return (row + col) % 2 === 0 ? '#1594da' : '#c0dae6'; // Light blue and gray
};

const getSquareFromCoordinates = (row, col) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return `${files[col]}${8 - row}`;
};

const styles = StyleSheet.create({
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
});

export default ChessBoard;
