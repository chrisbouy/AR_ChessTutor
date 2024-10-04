import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import GameLogic from './GameLogic';                

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [topText, setTopText] = useState('Waiting on player');
  const [bottomText, setBottomText] = useState('Make your move!');

  // Add animated values for opacity
  const topTextOpacity = useRef(new Animated.Value(1)).current;
  const bottomTextOpacity = useRef(new Animated.Value(1)).current;

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

    // Reset opacities
    topTextOpacity.setValue(1);
    bottomTextOpacity.setValue(1);

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

      // --- Start of modifications ---
      // Change the top text to 'Thinking...' and wait for 1 second
      setTopText('Thinking...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const fenAfterPlayerMove = gameLogicRef.current.chess.fen();
      const bestMoveForBlack = await gameLogicRef.current.getBestMoveFromLichess(fenAfterPlayerMove);

      if (!bestMoveForBlack) {
        setTopText("Failed to get computer's move from Lichess.");
        return;
      }

      // Make the computer's move
      const blackMoveResult = gameLogicRef.current.makeMove(bestMoveForBlack.san);
      if (!blackMoveResult) {
        setTopText("Computer's move failed.");
        return;
      }
      setBoardState([...gameLogicRef.current.getBoardState()]);

      // Change the top text to 'Analyzing...'
      setTopText('Analyzing...');

      const fenAfterComputerMove = gameLogicRef.current.chess.fen();
      const bestMoveForWhite = await gameLogicRef.current.getBestMoveFromLichess(fenAfterComputerMove);

      if (!bestMoveForWhite.uci) {
        console.error('bestMoveForWhite.uci is undefined');
        setTopText('Failed to get best move for player from Lichess');
        return;
      }
      const apiName = 'Gemini';  
      const analysis = await gameLogicRef.current.getAdviceFromAPI(apiName, bestMoveForWhite.uci);
      if (!analysis) {
        setTopText('Failed to get analysis from AI');
        return;
      }

      // Fade out the text components
      Animated.timing(topTextOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      Animated.timing(bottomTextOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // After fade out is complete, update the text and fade in
        setTopText(analysis.analysisSummary);
        setBottomText(analysis.adviceSummary);

        // Fade in the text components
        Animated.timing(topTextOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        Animated.timing(bottomTextOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });

      console.log(`${analysis.analysisSummary}`);
      console.log(`${analysis.adviceSummary}`);
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

      {/* Use Animated.Text and apply the opacity */}
      <Animated.Text style={[styles.topText, { opacity: topTextOpacity }]}>
        {topText}
      </Animated.Text>

      <ChessBoard2D boardState={boardState} onMove={onMove} />

      {/* Use Animated.Text and apply the opacity */}
      <Animated.Text style={[styles.bottomText, { opacity: bottomTextOpacity }]}>
        {bottomText}
      </Animated.Text>
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
    fontSize: 26.5,
    marginTop: 20,
    color: '#aec4e8',
    textAlign: 'center',
    pointerEvents: 'none',  // This makes the text non-interactive
  },
  bottomText: {
    fontSize: 26.5,
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
  topTextContainer: {
    opacity: 1, // Initial opacity
  },
  bottomTextContainer: {
    opacity: 1, // Initial opacity
  },
});

export default App;