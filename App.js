import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [topText, setTopText] = useState('Waiting on player');
  const [bottomText, setBottomText] = useState('Make your move!');

  useEffect(() => {
    gameLogicRef.current = new GameLogic();
    setBoardState(gameLogicRef.current.getBoardState());
  }, []);

  const handleReload = () => {
    console.log('Reloading the game...');
    gameLogicRef.current = new GameLogic();
    setBoardState(gameLogicRef.current.getBoardState());
    setTopText('Waiting on player');
    setBottomText('Make your move!');
    console.log('Game reloaded successfully.');
  };

  const onMove = async (fromSquare, toSquare) => {
    try {
      console.log('Player attempting to move...');
      const playerMove = gameLogicRef.current.makeMove({ from: fromSquare, to: toSquare });
      if (!playerMove) {
        setTopText('Invalid move, please try again.');
        return;
      }
      setBoardState([...gameLogicRef.current.getBoardState()]);
      setTopText('Waiting for computer to move...');
  
      const fenAfterPlayerMove = gameLogicRef.current.chess.fen();
      const bestMoveForBlack = await gameLogicRef.current.getBestMoveFromLichess(fenAfterPlayerMove);
  
      if (!bestMoveForBlack) {
        setTopText("Failed to get computer's move from Lichess.");
        return;
      }
  
      const blackMoveResult = gameLogicRef.current.makeMove(bestMoveForBlack.uci);
      if (!blackMoveResult) {
        setTopText("Computer's move failed.");
        return;
      }
      setBoardState([...gameLogicRef.current.getBoardState()]);
  
      const fenAfterComputerMove = gameLogicRef.current.chess.fen();
      const bestMoveForWhite = await gameLogicRef.current.getBestMoveFromLichess(fenAfterComputerMove);
  
      if (!bestMoveForWhite.uci) {
        console.error('bestMoveForWhite.uci is undefined');
        setTopText('Failed to get best move for player from Lichess');
        return;
      }

      const analysis = await gameLogicRef.current.getAdviceFromAI(bestMoveForWhite.uci);
      if (!analysis) {
        setTopText('Failed to get analysis from AI');
        return;
      }
  
      setTopText(`Analysis of Computer's move: ${analysis.analysisSummary}`);
      setBottomText(`Advice for Player: ${analysis.adviceSummary}`);
      console.log(`Analysis: ${analysis.analysisSummary}`);
      console.log(`Advice: ${analysis.adviceSummary}`);
    } catch (error) {
      console.error('Error during move:', error);
      setTopText('Error processing move, please try again.');
    }
  };
  
  

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
    backgroundColor: '#191d24',
    padding: 10,
  },
  reloadButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1, // Optional: Add a border to make the button more visible
    borderColor: 'white', // Optional: Set the border color
    zIndex: 1000,
  },
  reloadButtonText: {
    color: 'white', // Button text color
    fontWeight: 'bold',
  },
  topText: {
    fontSize: 16.5,
    marginTop: 20,
    color: '#aec4e8',
    textAlign: 'center',
    pointerEvents: 'none',  // This makes the text non-interactive
  },
  bottomText: {
    fontSize: 16.5,
    marginTop: 20,
    color: '#aec4e8',
    textAlign: 'center',
    pointerEvents: 'none',  // This makes the text non-interactive
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
