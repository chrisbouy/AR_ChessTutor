import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [selectedSquare, setSelectedSquare] = useState(null); // Track the selected square
  const [topText, setTopText] = useState('Waiting on player');
  const [bottomText, setBottomText] = useState('Make your move!');
  const [illegalMoveSquares, setIllegalMoveSquares] = useState(null); // Track illegal move squares
  const [advisedMove, setAdvisedMove] = useState({ from: null, to: null }); // Track advised move

  const topTextOpacity = useRef(new Animated.Value(1)).current;
  const bottomTextOpacity = useRef(new Animated.Value(1)).current;
  const thinkingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setBoardState(gameLogicRef.current.getBoardState());
  }, []);

  const handleReload = () => {
    console.log('Reloading the game...');
    gameLogicRef.current = new GameLogic();
    setBoardState(gameLogicRef.current.getBoardState());
    setSelectedSquare(null);
    setTopText('Waiting on player');
    setBottomText('Make your move!');
    setIllegalMoveSquares(null);
    setAdvisedMove({ from: null, to: null });
    topTextOpacity.setValue(1);
    bottomTextOpacity.setValue(1);
    thinkingOpacity.setValue(0);
    console.log('Game reloaded successfully.');
  };

  const onSquarePress = (position) => {
    if (!selectedSquare) {
      if (gameLogicRef.current.getPieceAt(position)) {
        setSelectedSquare(position);
        console.log(`Selected square: ${position}`);
      }
    } else {
      console.log(`Attempting move from ${selectedSquare} to ${position}`);
      onMove(selectedSquare, position);
      setSelectedSquare(null);
    }
  };

  const onMove = async (fromSquare, toSquare) => {
    try {
      console.log(`Attempting to move from ${fromSquare} to ${toSquare}...`);
      const playerMove = gameLogicRef.current.makeMove({ from: fromSquare, to: toSquare });
      if (!playerMove) {
        setIllegalMoveSquares({ from: fromSquare, to: toSquare });
        return;
      }
      setBoardState([...gameLogicRef.current.getBoardState()]);
      setIllegalMoveSquares(null);

      // Fade out the current advice and analysis
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
        // Once advice fades out, show "Thinking..."
        setTopText('Thinking...');
        Animated.timing(thinkingOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });

      // Get Lichess response
      const fenAfterPlayerMove = gameLogicRef.current.chess.fen();
      const bestMoveForBlack = await gameLogicRef.current.getBestMoveFromLichess(fenAfterPlayerMove, 'black');

      if (!bestMoveForBlack) {
        setTopText("Failed to get computer's move from Lichess.");
        return;
      }

      const blackMoveResult = gameLogicRef.current.makeMove(bestMoveForBlack.san);
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
      } else {
        setAdvisedMove({
          from: bestMoveForWhite.uci.slice(0, 2),
          to: bestMoveForWhite.uci.slice(2, 4),
        });
      }

      const apiName = 'Perplexity';  
      const analysis = await gameLogicRef.current.getAdviceFromAPI(apiName, bestMoveForWhite.uci);

      if (!analysis) {
        setTopText('Failed to get analysis from AI');
        return;
      }

      // Once Gemini response is received, fade out "Thinking..."
      Animated.timing(thinkingOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Update text and fade it in
        setTopText(analysis.analysisSummary);
        setBottomText(analysis.adviceSummary);

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

    } catch (error) {
      console.error('Error during move:', error);
      setTopText('Error processing move, please try again.');
      setIllegalMoveSquares({ from: fromSquare, to: toSquare });
    }
  };

  if (!boardState || boardState.length === 0) {
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

      {/* Animated text for top advice */}
      <Animated.Text style={[styles.topText, { opacity: topTextOpacity }]}>
        {topText}
      </Animated.Text>

      {/* Thinking text */}
      <Animated.Text style={[styles.thinkingText, { opacity: thinkingOpacity }]}>
        Thinking...
      </Animated.Text>

      <ChessBoard2D
        boardState={boardState}
        onSquarePress={onSquarePress}
        selectedSquare={selectedSquare}
        illegalMoveSquares={illegalMoveSquares}
        advisedMove={advisedMove}
      />

      <Animated.Text style={[styles.bottomText, { opacity: bottomTextOpacity }]}>
        {bottomText}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191d24',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'white',
    zIndex: 1000,
  },
  reloadButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  topText: {
    fontSize: 26.5,
    marginTop: 20,
    marginBottom: 20,
    color: '#aec4e8',
    textAlign: 'center',
  },
  bottomText: {
    fontSize: 26.5,
    marginTop: 20,
    color: '#aec4e8',
    textAlign: 'center',
  },
  thinkingText: {
    fontSize: 26.5,
    color: '#ffcc00',
    textAlign: 'center',
    marginTop: 20,
    position: 'absolute',
    top: 50,
    opacity: 0, // Initially invisible
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;
