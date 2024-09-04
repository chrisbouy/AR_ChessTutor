import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import ChessBoard from './components/ChessBoard';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic()); // Use useRef to maintain the same instance
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [aiMove, setAIMove] = useState('');
  const [statusMessage, setStatusMessage] = useState(''); // State to manage status messages

  const onMove = (fromSquare, toSquare) => {
    try {
      const moveResult = gameLogicRef.current.makeMove(fromSquare, toSquare);
      
      if (moveResult) {
        setBoardState(gameLogicRef.current.getBoardState());
        
        setTimeout(() => {
          const aiResult = gameLogicRef.current.makeAIMove();
          if (aiResult) {
            setBoardState(aiResult.boardState);
            setAIMove(aiResult.move.san);
          }
        }, 500);
  
        return moveResult;
      } else {
        // No need to show 'Invalid Move' message in the top text box anymore
        return null;
      }
    } catch (error) {
      // Log the error to the console for debugging purposes, but no need to display it in the UI
      console.error("Error in onMove:", error.message);
      return null;
    }
  };
  
  

  useEffect(() => {
    console.log("Current board state:", boardState);
  }, [boardState]);

  return (
    <View style={styles.container}>
      {/* Status message displayed above the chessboard */}
      <Text style={styles.statusText}>{statusMessage}</Text>

      <ChessBoard
        boardState={boardState}
        onMove={onMove}
      />

      {/* Optionally display AI move below the chessboard */}
      {aiMove && <Text style={styles.statusText}>AI Move: {aiMove}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10, // Space between status and the chessboard
    color: 'red', // Color to make the message stand out
  },
});

export default App;
