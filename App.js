import React, { useState, useRef } from 'react';
import { View, StyleSheet, Button, Text, TouchableOpacity } from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [aiMove, setAIMove] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [topText, setTopText] = useState('Waiting on player');
  const [bottomText, setBottomText] = useState('Make your move!');
  
  const handleReload = () => {
    gameLogicRef.current = new GameLogic(); // Reset game logic
    setBoardState(gameLogicRef.current.getBoardState());
    setTopText('Waiting on player');
    setBottomText('Make your move!');
  };

  const onMove = async (fromSquare, toSquare) => {
    const moveResult = gameLogicRef.current.makeMove(fromSquare, toSquare);

    if (moveResult) {
      setBoardState(gameLogicRef.current.getBoardState()); // Update the board state after the player moves
      setTopText('Analyzing AI move...'); // Show analysis message

      // Fetch AI move and advice from Gemini
      const aiMoveResult = await gameLogicRef.current.makeCombinedCall();

      if (aiMoveResult) {
        // Update the board with the AI's move and show advice
        setBoardState(aiMoveResult.boardState);
        setTopText(`Analysis of move: ${aiMoveResult.move.san} ${aiMoveResult.analysisSummary}`);
        setBottomText(`Advice for you: ${aiMoveResult.adviceSummary}`);
      } else {
        setTopText('No valid move found from AI.');
      }
    } else {
      setTopText('Invalid move, please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
        <Text style={styles.reloadButtonText}>Reload</Text>
      </TouchableOpacity>
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
    backgroundColor: 'black',
    padding: 10,
  },
  reloadButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'blue',
    borderRadius: 10,
    padding: 10,
  },
  reloadButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  topText: {
    fontSize: 15,
    marginTop: 20,
    color: 'blue',
    textAlign: 'center',
  },
  bottomText: {
    fontSize: 15,
    marginTop: 20,
    color: 'green',
    textAlign: 'center',
  },
});

export default App;
