import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [openingName, setOpeningName] = useState('');
  const [openingAnalysis, setOpeningAnalysis] = useState('');
  const [recommendedNextMoves, setRecommendedNextMoves] = useState('');
  const [illegalMoveSquares, setIllegalMoveSquares] = useState(null);
  const [advisedMove, setAdvisedMove] = useState(null);

  const textOpacity = useRef(new Animated.Value(1)).current;
  const thinkingOpacity = useRef(new Animated.Value(0)).current;
  const analysisComplete = useRef(false);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const chessboardSize = Math.min(windowWidth, windowHeight) * 0.9;

  const guidelineBaseWidth = 350; // Base width
  const scaleFont = (size) => (windowWidth / guidelineBaseWidth) * size;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: '#191d24',
        },
        reloadButtonContainer: {
          alignItems: 'flex-end',
          padding: 5,
          backgroundColor: '#191d24',
        },
        reloadButton: {
          backgroundColor: 'transparent',
          borderRadius: 10,
          padding: 2,
          borderWidth: 1,
          borderColor: 'white',
        },
        reloadButtonText: {
          color: 'white',
          fontWeight: 'bold',
        },
        container: {
          flex: 1,
          backgroundColor: '#191d24',
          alignItems: 'center',
        },
        chessboardContainer: {
marginRight: 20,
          alignItems: 'center',
          justifyContent: 'center',
          width: chessboardSize,
          height: chessboardSize,
        },
        textContainer: {
          flexGrow: 1,
          alignItems: 'center',
          width: '100%',
        },
        analysisContainer: {
          alignItems: 'center',
          marginTop: 2,
          paddingHorizontal: 10,
          width: '90%',
        },
        prefixText: {
          fontWeight: 'bold',
          fontSize: scaleFont(20),
          color: '#ffffff',
        },
        openingName: {
          fontSize: scaleFont(26),
          color: '#aec4e8',
          textAlign: 'center',
          marginBottom: 1,
        },
        openingAnalysis: {
          fontSize: scaleFont(18),
          marginTop: 10,
          marginBottom: 10, // Add if needed
          color: '#aec4e8',
          textAlign: 'left',
          lineHeight: scaleFont(24),
          paddingHorizontal: 10, // Ensure consistency
        },
        recommendedNextMoves: {
          fontSize: scaleFont(18),
          marginTop: 10,
          marginBottom: 10, // Add if needed
          color: '#aec4e8',
          textAlign: 'left',
          lineHeight: scaleFont(24),
          paddingHorizontal: 10, // Ensure consistency
        },
        
        thinkingText: {
          fontSize: scaleFont(24),
          color: '#ffcc00',
          textAlign: 'center',
          position: 'absolute',
          top: '60%',
        },
      }),
    [windowWidth]
  );
  

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
        if (!bestMoveForBlack || !bestMoveForBlack.move) {
          setOpeningName("Computer's move failed.");
          return;
        }
        // Update the board state since the move was already made
        setBoardState([...gameLogicRef.current.getBoardState()]);
      } else {
        // If we have a move from Lichess, apply it
        const blackMoveResult = gameLogicRef.current.makeMove(bestMoveForBlack.san);
        if (!blackMoveResult) {
          setOpeningName("Computer's move failed.");
          return;
        }
        setBoardState([...gameLogicRef.current.getBoardState()]);
      }

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
    } catch (error) {
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
    <SafeAreaView style={styles.safeArea}>
      {/* Place the reload button at the top */}
      <View style={styles.reloadButtonContainer}>
        <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
          <Text style={styles.reloadButtonText}>Reload</Text>
        </TouchableOpacity>
      </View>

      {/* Content below the reload button */}
      <View style={styles.container}>
        {/* Chessboard */}
        <View style={styles.chessboardContainer}>
          <ChessBoard2D
            boardSize={chessboardSize}
            boardState={boardState}
            onSquarePress={onSquarePress}
            selectedSquare={selectedSquare}
            illegalMoveSquares={illegalMoveSquares}
            advisedMove={analysisComplete.current ? advisedMove : null}
          />
        </View>

        {/* Analysis texts */}
        <ScrollView contentContainerStyle={styles.textContainer}>
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
    </SafeAreaView>
  );
};

export default App;
