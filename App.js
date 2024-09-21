import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [aiMove, setAIMove] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [topText, setTopText] = useState('Waiting on player');
  const [bottomText, setBottomText] = useState('Make your move!');

  // Initialize GameLogic class instance when the component mounts
  useEffect(() => {
    gameLogicRef.current = new GameLogic();
    setBoardState(gameLogicRef.current.getBoardState()); // Safely set the board state after initialization
  }, []);

  const handleReload = () => {
    gameLogicRef.current = new GameLogic(); // Reset game logic
    setBoardState(gameLogicRef.current.getBoardState());
    setTopText('Waiting on player');
    setBottomText('Make your move!');
  };

  const onMove = async (fromSquare, toSquare) => {
    try {
      console.log('Player attempting to move...');
  
      // Player makes a move and the AI generates its response
      const moveResult = await gameLogicRef.current.makePlayerMoveAndGenerateAIResponse(fromSquare, toSquare);
  
      if (moveResult) {
        // console.log('Move result:', moveResult);
        
        // Update the board with the new state after AI's move
        setBoardState(moveResult.boardState);
  
        // Show the analysis for AI's last move and advice for the player
        setTopText(`Analysis of Black's move: ${moveResult.analysisSummary}`);
        setBottomText(`Advice for White: ${moveResult.adviceSummary}`);
          } else {
        setTopText('Invalid move, please try again.');
      }
    } catch (error) {
      console.error('Error during move:', error);
      setTopText('Error processing move, please try again.');
    }
  };
  

  // Ensure the board state is initialized before rendering
  if (!boardState) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading board...</Text>
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;
