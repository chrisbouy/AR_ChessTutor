import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import ChessBoard3D from './components/ChessBoard3D'; // Placeholder for your 3D board
import ChessBoardAR from './components/ChessBoardAR'; // Placeholder for your AR board
import GameLogic from './GameLogic';



const App = () => {
  const gameLogicRef = useRef(new GameLogic()); // Use useRef to maintain the same instance
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [aiMove, setAIMove] = useState('');
  const [statusMessage, setStatusMessage] = useState(''); // State to manage status messages
  const [boardType, setBoardType] = useState('2D'); // State to track the current board type
  const [topText, setTopText] = useState('Waiting on player'); // Initial state for top text
  const [bottomText, setBottomText] = useState('Make your move!'); // Initial state for bottom text
  const [isFirstMove, setIsFirstMove] = useState(true); // To track if it’s the player’s first move

  const toggleBoard = () => {
    // Toggle between 2D, 3D, and AR boards
    if (boardType === '2D') {
      setBoardType('3D');
    } else if (boardType === '3D') {
      setBoardType('AR');
    } else {
      setBoardType('2D');
    }
  }; 
  const onMove = (fromSquare, toSquare) => {
    try {
      const moveResult = gameLogicRef.current.makeMove(fromSquare, toSquare);
      
      if (moveResult) {
        setBoardState(gameLogicRef.current.getBoardState());
              // Bottom text: Player's move, followed by AI advice placeholder
      setBottomText(`Player moved from ${fromSquare} to ${toSquare}\nAI move advice will go here eventually`);

      setTopText('Waiting...'); // Set top text to 'Waiting' while AI is thinking

      setTimeout(async () => {
        const aiMoveResult = await gameLogicRef.current.makeAIMove();
        if (aiMoveResult) {
          setBoardState(aiMoveResult.boardState);
          setAIMove(aiMoveResult.move.san); // Ensure aiMoveResult has a move and boardState
          // Additional logic for setting topText for the AI move
          if (isFirstMove) {
            setTopText(`Computer moved: ${aiMoveResult.move.san}\nAnalysis of computer's move: ${aiMoveResult.explanation}\nWaiting on player's move.`);
            setIsFirstMove(false);
          } else {
            setTopText(`Computer moved: ${aiMoveResult.move.san}\nAnalysis of computer's move: ${aiMoveResult.explanation}\nWaiting on player's move.`);
          }
        } else {
          console.error("AI move could not be generated.");
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
   // console.log("Current board state:", boardState);
  }, [boardState]);

  return (
    <View style={styles.container}>
      <Text style={styles.topText}>{topText}</Text>

      {/* <ChessBoard2D
        boardState={boardState}
        onMove={onMove}
      /> */}
      {/* {boardType === '2D' && <ChessBoard2D />}
      {boardType === '3D' && <ChessBoard3D />}
      {boardType === 'AR' && <ChessBoardAR />} */}
      {boardType === '2D' && (<ChessBoard2D
                                  boardState={boardState}
                                  onMove={onMove}
                                />
      )}
{boardType === '3D' && <ChessBoard3D />}
{boardType === 'AR' && <ChessBoardAR />}

      <Text style={styles.bottomText}>{bottomText}</Text>
      <Button title={`Switch to ${boardType === '2D' ? '3D' : boardType === '3D' ? 'AR' : '2D'} Board`} onPress={toggleBoard} />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', 
    padding: 10,
  },
  topText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'blue',
    textAlign: 'center', // Center-align the text for better presentation
    lineHeight: 24, // Line height for better spacing between lines
  },
  bottomText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: 'green',
    textAlign: 'center', // Center-align the text for better presentation
    lineHeight: 24, // Line height for better spacing between lines
  },
});

export default App;