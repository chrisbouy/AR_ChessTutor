import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, ScrollView } from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [selectedSquare, setSelectedSquare] = useState(null); // Track the selected square
  const [openingName, setOpeningName] = useState('');
  const [openingAnalysis, setOpeningAnalysis] = useState('');
  const [recommendedNextMoves, setRecommendedNextMoves] = useState('');
  
  const [illegalMoveSquares, setIllegalMoveSquares] = useState(null); // Track illegal move squares
  const [advisedMove, setAdvisedMove] = useState(null); // Track advised move, but don't show until analysis fades in

  const textOpacity = useRef(new Animated.Value(1)).current;
  const thinkingOpacity = useRef(new Animated.Value(0)).current;
  const analysisComplete = useRef(false); // To track when analysis has faded in

  useEffect(() => {
    setBoardState(gameLogicRef.current.getBoardState());
  }, []);

  const handleReload = () => {
    gameLogicRef.current = new GameLogic();
    setBoardState(gameLogicRef.current.getBoardState());
    setSelectedSquare(null);
    setIllegalMoveSquares(null);
    setAdvisedMove(null);
    setOpeningName('');
    setOpeningAnalysis('');
    setRecommendedNextMoves('');
    textOpacity.setValue(1);
    thinkingOpacity.setValue(0);
    analysisComplete.current = false;
  };
  

  const onSquarePress = (position) => {
    if (!selectedSquare) {
      if (gameLogicRef.current.getPieceAt(position)) {
        setSelectedSquare(position);
      }
    } else {
      onMove(selectedSquare, position);
      setSelectedSquare(null);
    }
  };
  const onMove = async (fromSquare, toSquare) => {
    try {
      const playerMove = gameLogicRef.current.makeMove({ from: fromSquare, to: toSquare });
      if (!playerMove) {
        setIllegalMoveSquares({ from: fromSquare, to: toSquare });
        return;
      }
      setBoardState([...gameLogicRef.current.getBoardState()]);
      setIllegalMoveSquares(null);
      // Fade out the current advice and analysis
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Once advice fades out, show "Thinking..."
        Animated.timing(thinkingOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
      // Get the best move for Black
      let bestMoveForBlack = await gameLogicRef.current.getBestMoveFromLichess('black');
      if (!bestMoveForBlack) {
        console.log('Lichess API failed for Black, falling back to AI.');
        bestMoveForBlack = await gameLogicRef.current.makeAIMoveForBlack();
      }
      else {
              const blackMoveResult = gameLogicRef.current.makeMove(bestMoveForBlack.san);
              if (!blackMoveResult) {
                setOpeningName("Computer's move failed.");
                return;
              }
      }


      setBoardState([...gameLogicRef.current.getBoardState()]);

      // Get the best move for White
      let bestMoveForWhite = await gameLogicRef.current.getBestMoveFromLichess('white');
      if (!bestMoveForWhite) {
        console.log('Lichess API failed for White, falling back to AI.');
        bestMoveForWhite = await gameLogicRef.current.getAdvisedMoveFromAI_ForWhite();
      }

      if (!bestMoveForWhite || !bestMoveForWhite.uci) {
        console.error('bestMoveForWhite.uci is undefined');
        setOpeningName('Failed to get best move for player from Lichess.');
        return;
      } else {
        setAdvisedMove({
          from: bestMoveForWhite.uci.slice(0, 2),
          to: bestMoveForWhite.uci.slice(2, 4),
        });
      }

      // Fetch analysis from the API
      const apiName = 'Claude'; // Change to 'Gemini' if needed
      const analysis = await gameLogicRef.current.getAdviceFromAPI(apiName);

      if (!analysis) {
        setOpeningName('Failed to get analysis from AI');
        setOpeningAnalysis('');
        setRecommendedNextMoves('');
        return;
      }

      // Fade out "Thinking..." and show the analysis
      Animated.timing(thinkingOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Set the new state variables
        setOpeningName(analysis.openingName);
        setOpeningAnalysis(analysis.openingAnalysis);
        setRecommendedNextMoves(analysis.recommendedNextMoves);

        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          analysisComplete.current = true; // Mark analysis as complete
        });
      });
    }
    catch (error) {
      console.error('Error during move:', error);
      setOpeningName('Error processing move, please try again.');
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

    <View style={styles.chessboardContainer}>
      <ChessBoard2D
        boardState={boardState}
        onSquarePress={onSquarePress}
        selectedSquare={selectedSquare}
        illegalMoveSquares={illegalMoveSquares}
        advisedMove={analysisComplete.current ? advisedMove : null}
      />
    </View>

    {/* Wrap texts in a ScrollView in case content overflows */}
    <ScrollView contentContainerStyle={styles.textContainer}>
      {/* Analysis texts */}
      <Animated.View style={[styles.analysisContainer, { opacity: textOpacity }]}>
        {openingName ? (
          <Text style={styles.openingName}>{openingName}</Text>
        ) : null}

        {openingAnalysis ? (
          <Text style={styles.openingAnalysis}>
            <Text style={styles.prefixText}>Opening Analysis:{'\n'}</Text>
            {openingAnalysis}
          </Text>
        ) : null}

        {recommendedNextMoves ? (
          <Text style={styles.recommendedNextMoves}>
            <Text style={styles.prefixText}>Recommended Moves and Likely Counters:{'\n'}</Text>
            {recommendedNextMoves}
          </Text>
        ) : null}
      </Animated.View>
    </ScrollView>

    {/* Thinking text */}
    <Animated.Text style={[styles.thinkingText, { opacity: thinkingOpacity }]}>
      Thinking...
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
  },
  reloadButton: {
    position: 'absolute',
    top: 50,
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
  chessboardContainer: {
    marginTop: 80,
    marginLeft: 0,
    marginRight: 25,
  },
  thinkingText: {
    fontSize: 34,
    color: '#ffcc00',
    textAlign: 'center',
    position: 'absolute',
    top: '60%', // Adjust as needed
  },
  openingName: {
    fontSize: 26,
    marginTop: 20,
    color: '#aec4e8',
    textAlign: 'center',
  },
  openingAnalysis: {
    fontSize: 24,
    marginTop: 10,
    color: '#aec4e8',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  recommendedNextMoves: {
    fontSize: 24,
    marginTop: 10,
    color: '#aec4e8',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default App;
