import React, { useState, useRef } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [aiMove, setAIMove] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [topText, setTopText] = useState('Waiting on player');
  const [bottomText, setBottomText] = useState('Make your move!');
  
  const onMove = async (fromSquare, toSquare) => {
    const moveResult = gameLogicRef.current.makeMove(fromSquare, toSquare);
  
    if (moveResult) {
      setBoardState(gameLogicRef.current.getBoardState()); // Update the board state after the player moves
      setTopText('Analyzing AI move...'); // Show analysis message
  
      // Fetch the AI move result
      const aiMoveResult = await gameLogicRef.current.makeAIMove();
  
      if (aiMoveResult) {
        // Update the board with the AI's move
        setBoardState(aiMoveResult.boardState);
  
        // Set the AI move and explanation at the top of the screen
        setTopText(`Computer moved: ${aiMoveResult.move.san}\nAnalysis: ${aiMoveResult.explanation}`);
        const playerAdvice = await gameLogicRef.current.getPlayerMoveAdvice();
        if (playerAdvice) {
          setBottomText(`Advice for you: ${playerAdvice}`);
        }
      
      
      
      } else {
        setTopText('No valid move found from AI.');
      }
    } else {
      setTopText('Invalid move, please try again.');
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.topText}>{topText}</Text>
      <ChessBoard2D boardState={boardState} onMove={onMove} />
      <Text style={styles.bottomText}>{bottomText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',  // Set background to black
    padding: 10,
  },
  topText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
    color: 'blue',
    textAlign: 'center',
  },
  bottomText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
    color: 'green',
    textAlign: 'center',
  },
});

export default App;