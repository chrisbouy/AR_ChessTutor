import React, { useState, useRef, useEffect, useMemo } from 'react';
// Import React and necessary hooks

import {
  View,
  useWindowDimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
// Import React Native components

import ChessBoard2D from './ChessBoard2D';
// Import custom ChessBoard2D component

import GameLogic from '../GameLogic';
// Import GameLogic class

import SANPopup from './SANPopup.js';
// Import SANPopup component for displaying move descriptions

import SplashScreen from 'react-native-splash-screen';
// Import SplashScreen to hide the splash screen once the app is ready

const ChessTutorApp = () => {
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  // Hide the splash screen when the component mounts

  const gameLogicRef = useRef(new GameLogic());
  // Use a ref to hold the GameLogic instance

  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  // State for the current board state

  const [selectedSquare, setSelectedSquare] = useState(null);
  // State for the currently selected square

  const [recommendedNextMoves, setRecommendedNextMoves] = useState([]);
  // State for the recommended next moves from the AI

  const [positionAnalysis, setPositionAnalysis] = useState('');

  const [illegalMoveSquares, setIllegalMoveSquares] = useState(null);
  // State for illegal moves (to highlight them)

  const [advisedMove, setAdvisedMove] = useState(null);
  // State for the advised move

  const scrollViewRef = useRef(null);
  // Ref for the ScrollView to allow scrolling to the top

  const textOpacity = useRef(new Animated.Value(1)).current;
  // Animated value for text opacity

  const thinkingOpacity = useRef(new Animated.Value(0)).current;
  // Animated value for thinking overlay opacity

  const analysisComplete = useRef(false);
  // Ref to indicate whether the analysis is complete

  const positionAnalysisExtracted = useRef(false);
  // Ref to indicate whether the position analysis has been extracted

  const [possibleMoves, setPossibleMoves] = useState([]);
  // State for possible moves (legal moves for the selected piece)

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Get window dimensions for responsive design

  const chessboardSize = Math.min(windowWidth, windowHeight) * 0.9;
  // Calculate chessboard size based on window dimensions

  const [isLandscape, setIsLandscape] = useState(false);
  // State to detect if the device is in landscape mode

  const guidelineBaseWidth = 350; // Base width for scaling fonts

  const scaleFont = (size) => (windowWidth / guidelineBaseWidth) * size;
  // Function to scale fonts based on window width

  const [movesLeft, setMovesLeft] = useState(12);
  // State for the number of moves left (starting from 12 half-moves)

  const [isThinking, setIsThinking] = useState(false);
  // State to indicate if the AI is thinking

  const [popupVisible, setPopupVisible] = useState(false);
  // State to control the visibility of the SANPopup

  const [popupDescription, setPopupDescription] = useState('');
  // State for the description text in the SANPopup

  const [displayedArrows, setDisplayedArrows] = useState([]);
  // State for the arrows displayed on the chessboard

  // Function to initialize API keys securely
  async function initializeApiKeys() {
    await gameLogicRef.current.removeApiKey();
    // Remove any existing API key

    await gameLogicRef.current.storeApiKey('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');
    // Store your actual API key securely (replace 'YOUR_API_KEY_HERE' with your actual API key)
  }

  useEffect(() => {
    initializeApiKeys();
  }, []);
  // Initialize API keys when the component mounts

  // Memoized styles for performance optimization
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: '#191d24',
        },
        reloadButtonContainer: {
          padding: 0,
          backgroundColor: '#191d24',
          marginRight: 2,
        },
        reloadButton: {
          backgroundColor: 'transparent',
          borderRadius: 10,
          padding: 5,
          borderWidth: 1,
          borderColor: 'white',
        },
        reloadButtonText: {
          color: 'white',
          fontWeight: 'bold',
        },
        warningContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#191d24',
        },
        warningText: {
          fontSize: 24,
          color: '#fff',
          textAlign: 'center',
          paddingHorizontal: 20,
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
          alignItems: 'stretch',
          width: '100%',
        },
        analysisContainer: {
          alignItems: 'stretch',
          marginTop: 25,
          paddingHorizontal: 10,
          width: '90%',
          marginLeft: 35,
        },
        analysisTitle: {
          fontWeight: 'bold',
          fontSize: scaleFont(20),
          color: '#ffffff',
          marginBottom: 5,
          alignSelf: 'center',
        },
        analysisText: {
          fontSize: scaleFont(18),
          color: 'white',
          marginBottom: 15,
        },
        tableContainer: {
          width: '105%',
          borderWidth: 1,
          borderColor: 'white',
          borderRadius: 8,
          overflow: 'hidden',
          alignSelf: 'center',
          marginBottom: 25,
        },
        tableRow: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: 'white',
        },
        tableCell: {
          flex: 1,
          padding: 3,
          fontSize: 18,
          color: '#aec4e8',
          textAlign: 'center',
          fontSize:20,
          borderRightWidth: 1,
          borderColor: 'white',
        },
        adviceColumn: {
          width: '40%',

        },
        responseColumn: {
          width: '60%',
        },
        tableHeader: {
          fontWeight: 'bold',
          backgroundColor: '#333',
          color: 'white',
        },
        scrollContainer: {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 10,
        },
        noDataText: {
          fontSize: scaleFont(20),
          color: '#aec4e8',
          textAlign: 'center',
          marginVertical: 10,
        },
        tappableMove: {
          textDecorationLine: 'underline',
          color: '#aec4e8',
          marginRight: 5,
          marginBottom: 5,
          marginLeft:5,
          fontSize:20,
          
        },
        overlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        overlayText: {
          color: '#ebc634',
          fontSize: 28,
          marginTop: 150,
        },
        moveCounterContainer: {
          top: 0,
          left: 10,
          backgroundColor: '#191d24',
          padding: 5,
          borderRadius: 5,
        },
        moveCounterText: {
          color: 'white',
          fontSize: scaleFont(16),
        },
        topBar: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 0,
          backgroundColor: '#191d24',
        },
        tableFooter: {
          paddingVertical: 10, // Adjust as needed
          alignItems: 'center',
          backgroundColor: '#191d24', // Optional
          borderWidth: 0,       
         },
        footerText: {
          fontSize: 16,
          color: '#aec4e8',
          fontStyle: 'italic', // Optional
          fontWeight: 'bold',  // Optional
        },
      }),
    [windowWidth]
  );
  // Styles depend on windowWidth and are recalculated when it changes

  const handleMovePress = (sanMove, color, reasoning, respondingTo = null) => {
    // Function to handle when a move in the advice table is pressed

    const description = gameLogicRef.current.convertMoveToDescription(sanMove, color);
    // Convert the SAN move to a human-readable description

    const displayText = respondingTo
      ? `Response to White's ${respondingTo}:\n\n${description}\n\n${reasoning}`
      : `${description}\n\n${reasoning}`;
    // Prepare the text to display in the popup

    setPopupDescription(displayText);
    // Set the popup description

    setPopupVisible(true);
    // Show the popup

    if (color === 'w') {
      // If the move is by White

      const moveObj = recommendedNextMoves.find((move) => move.originalMove === sanMove);
      // Find the move object in recommendedNextMoves

      if (moveObj && moveObj.from && moveObj.to) {
        setDisplayedArrows([
          {
            from: moveObj.from,
            to: moveObj.to,
            arrowOpacity: moveObj.arrowOpacity,
          },
        ]);
        // Set the arrow to display the move
      }
    } else if (color === 'b') {
      // If the move is by Black

      const advisedMoveObj = recommendedNextMoves.find((move) => move.originalMove === respondingTo);
      // Find the advised move object

      const responseMoveObj = advisedMoveObj.blackResponses.find((response) => response.move === sanMove);
      // Find the black response move object

      let arrows = [];
      if (advisedMoveObj && advisedMoveObj.from && advisedMoveObj.to) {
        arrows.push({
          from: advisedMoveObj.from,
          to: advisedMoveObj.to,
          arrowOpacity: advisedMoveObj.arrowOpacity,
        });
        // Add the advised move arrow
      }
      if (responseMoveObj && responseMoveObj.from && responseMoveObj.to) {
        arrows.push({
          from: responseMoveObj.from,
          to: responseMoveObj.to,
          arrowOpacity: 1.0, // Full opacity for Black's move
        });
        // Add the black response arrow
      }
      setDisplayedArrows(arrows);
      // Set the arrows to display
    }
  };

  const handleReload = () => {    // Function to handle the reload action
    gameLogicRef.current = new GameLogic();    // Reset the GameLogic instance
    setBoardState(gameLogicRef.current.getBoardState());    // Reset the board state
    setSelectedSquare(null);    // Deselect any selected square
    setIllegalMoveSquares(null);    // Clear illegal move highlights
    setAdvisedMove(null);    // Clear advised move
    setPositionAnalysis('');
    setRecommendedNextMoves([]);    // Clear recommended next moves
    setDisplayedArrows([]);    // Clear displayed arrows
    setPossibleMoves([]);    // Clear possible moves
    textOpacity.setValue(1);    // Reset text opacity
    thinkingOpacity.setValue(0);    // Reset thinking overlay opacity
    analysisComplete.current = false;    // Set analysis as incomplete
    positionAnalysisExtracted.current = false;    // Set position analysis as not extracted
    setMovesLeft(12);    // Reset moves left
  };

  const onSquarePress = (position) => {    // Function to handle when a square is pressed
    if (isThinking) {      // Do nothing if AI is thinking
      return;
    }
    const selectedPiece = gameLogicRef.current.getPieceAt(position);    // Get the piece at the pressed position
    if (!selectedSquare) {      // No piece is currently selected
      if (selectedPiece && selectedPiece.color === 'w') {        // If the selected square has a white piece
        setSelectedSquare(position);        // Set the selected square
        const legalMoves = gameLogicRef.current.getLegalMoves(position);        // Get legal moves for the selected piece
        const targetSquares = legalMoves.map((move) => move.to);        // Extract target squares
        setPossibleMoves(targetSquares);        // Highlight possible moves
      }
    } else {      // A piece is already selected
      if (selectedSquare === position) {        // User tapped the same square again
        setSelectedSquare(null);        // Deselect the square
        setPossibleMoves([]);        // Clear possible moves
      } else if (selectedPiece && selectedPiece.color === 'w') {        // User selected a different white piece
        setSelectedSquare(position);        // Update the selected square
        const legalMoves = gameLogicRef.current.getLegalMoves(position);        // Get legal moves for the new piece
        const targetSquares = legalMoves.map((move) => move.to);        // Extract target squares
        setPossibleMoves(targetSquares);        // Highlight possible moves
      } else {        // Attempt to make a move
        onMove(selectedSquare, position);        // Call onMove with from and to squares
        setSelectedSquare(null);        // Deselect the square
        setPossibleMoves([]);        // Clear possible moves
      }
    }
  };

  const onMove = async (fromSquare, toSquare) => {
    try {
      // Make the player's move
      const playerMove = gameLogicRef.current.makeMove({ from: fromSquare, to: toSquare });
      if (!playerMove) {
        setIllegalMoveSquares({ from: fromSquare, to: toSquare });
        return;
      }
  
      // Update the board state to reflect the player's move
      setBoardState([...gameLogicRef.current.getBoardState()]);
      setMovesLeft((prevMoves) => prevMoves - 1);
  
      // Check for game end conditions
      if (gameLogicRef.current.chess.isCheckmate()) {
        Alert.alert('Game Over', 'Checkmate! The game has ended.', [{ text: 'OK', onPress: () => handleReload() }]);
        return;
      }
      setDisplayedArrows([]);
      // Generate Black's move (this might take time)
      const blackMoveResult = await gameLogicRef.current.makeMove_Black();
  
      if (!blackMoveResult || !blackMoveResult.move) {
        // Handle error or make a random move
        console.log('AI failed to make a move for Black, making random move.');
        const randomMove = gameLogicRef.current.selectRandomMove();
        blackMoveResult = gameLogicRef.current.makeMove_Black(randomMove);
        if (!blackMoveResult) {
          Alert.alert("Computer's move failed.", 'Please try again.', [{ text: 'OK' }]);
          return;
        }
      }
      setTimeout(() => {
        setBoardState([...gameLogicRef.current.getBoardState()]);
        fetchAdviceAfterBlackMove();
      }, 500); // Delay of 500 ms
    } catch (error) {
      console.log('Error during move:', error);
      Alert.alert('Error', 'Error processing move, please try again.', [{ text: 'OK' }]);
      setIllegalMoveSquares({ from: fromSquare, to: toSquare });
    }
  };
  
  const fetchAdviceAfterBlackMove = async () => {
        setTimeout(() => {setIsThinking(true);}, 500);
    // Display the 'thinking' animation
    
  
    // Fetch advice from the AI
    const apiName = 'Claude_stream';
    const advice = await gameLogicRef.current.getAdviceFromAPI(apiName);
  
    setIsThinking(false);
  
    if (!advice) {
      setPositionAnalysis('');
      setRecommendedNextMoves([]);
      return;
    }
  
    gameLogicRef.current.latestAdvice = advice;
  
    // Process the advice
    const processedAdvice = renderMoveAdvice(advice);
    setRecommendedNextMoves(processedAdvice);
    setDisplayedArrows(
      processedAdvice.map((move) => ({
        from: move.from,
        to: move.to,
        arrowOpacity: move.arrowOpacity,
      }))
    );
    setPositionAnalysis(advice.positionAnalysis);
  
    // Update analysis complete flag
    analysisComplete.current = true;
  
    // Scroll to the top of the ScrollView
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  

  
  function renderMoveAdvice(advice) {
    return advice.recommendedNextMoves.map((move) => {
      let arrowOpacity = 1.0;
      let moveLabel = move.move;
      switch (move.priority) {
        case 'STRONG':
          arrowOpacity = 0.8;
          moveLabel = `${move.move} (STRONG)`;
          break;
        case 'OPTIONAL':
          arrowOpacity = 0.1;
          moveLabel = `${move.move} (OPTIONAL)`;
          break;
        default:
          arrowOpacity = 1.0;
      }

      // Get move details for the advised move
      const moveDetails = gameLogicRef.current.getMoveDetailsFromSAN(move.originalMove || move.move);
      let from = null;
      let to = null;
      let newFEN = null;
      if (moveDetails) {
        from = moveDetails.from;
        to = moveDetails.to;

        // Make the advised move to get the new FEN
        gameLogicRef.current.chess.move(move.originalMove || move.move);
        newFEN = gameLogicRef.current.chess.fen();
        gameLogicRef.current.chess.undo();
      }

      const enrichedBlackResponses = (move.blackResponses || []).map((response) => {
        // Get move details for the black response in the new position
        const responseDetails = gameLogicRef.current.getMoveDetailsFromSAN(response.move, newFEN);
        let responseFrom = null;
        let responseTo = null;
        if (responseDetails) {
          responseFrom = responseDetails.from;
          responseTo = responseDetails.to;
        }
        return {
          ...response,
          from: responseFrom,
          to: responseTo,
        };
      });
      return {
        ...move,
        move: moveLabel,
        arrowOpacity: arrowOpacity,
        originalMove: move.move,
        from: from,
        to: to,
        blackResponses: enrichedBlackResponses,
      };
    });
  }

  useEffect(() => {
    setIsLandscape(windowWidth > windowHeight);
    // Detect if the device is in landscape mode
  }, [windowWidth, windowHeight]);

  if (isLandscape) {
    return (
      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>Please rotate your device back to portrait mode.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar with move counter and reload button */}
      <View style={styles.topBar}>
        <View style={styles.moveCounterContainer}>
          <Text style={styles.moveCounterText}>Moves Left: {movesLeft}</Text>
        </View>

        <View style={styles.reloadButtonContainer}>
          <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
            <Text style={styles.reloadButtonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {/* Chessboard */}
          <View style={styles.chessboardContainer}>
            <ChessBoard2D
              boardSize={chessboardSize}
              boardState={boardState}
              onSquarePress={onSquarePress}
              selectedSquare={selectedSquare}
              illegalMoveSquares={illegalMoveSquares}
              advisedMove={analysisComplete.current ? advisedMove : null}
              possibleMoves={possibleMoves}
              isThinking={isThinking}
              recommendedMoves={displayedArrows}
            />
          </View>

          {/* Analysis texts */}
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.textContainer}>
            <Animated.View style={[styles.analysisContainer, { opacity: textOpacity }]}>
              {Array.isArray(recommendedNextMoves) && recommendedNextMoves.length > 0 ? (
                <View>
                  <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableHeader, styles.adviceColumn]}>Advice</Text>
                      <Text style={[styles.tableCell, styles.tableHeader, styles.responseColumn]}>
                        Likely Responses
                      </Text>
                    </View>
                    {recommendedNextMoves.map((move, index) => (
                      <View key={index} style={styles.tableRow}>
                        <View style={[styles.tableCell, styles.adviceColumn]}>
                          <TouchableOpacity
                            onPress={() => handleMovePress(move.originalMove, 'w', move.reasoning)}
                          >
                            <Text style={styles.tappableMove}>{move.move}</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.tableCell, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                          {move.blackResponses.map((response, idx) => (
                            <TouchableOpacity
                              key={idx}
                              onPress={() =>
                                handleMovePress(response.move, 'b', response.threat, move.originalMove)
                              }
                            >
                              <Text style={styles.tappableMove}>{response.move}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                  {/* Footer below the table */}
                  <View style={styles.tableFooter}>
                    <Text style={styles.footerText}>Tap a move above for analysis</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noDataText}>Make your move.</Text>
              )}
              {positionAnalysis ? (
                <View>
                    <View>
                      <Text style={styles.analysisTitle}>Game Analysis:</Text>
                      <Text style={styles.analysisText}>{positionAnalysis}</Text>
                    </View>
                </View>
              ) : null}
            </Animated.View>
          </ScrollView>
        </View>
        {isThinking && (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.overlayText}>Thinking...</Text>
          </View>
        )}
      </View>
      <SANPopup
        visible={popupVisible}
        description={popupDescription}
        onClose={() => {
          setPopupVisible(false);          // Close the popup
          setDisplayedArrows(          // Restore original advice arrows
            recommendedNextMoves.map((move) => ({
              from: move.from,
              to: move.to,
              arrowOpacity: move.arrowOpacity,
            }))
          );
        }}
      />
    </SafeAreaView>
  );
};
export default ChessTutorApp;
