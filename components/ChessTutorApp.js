import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import ChessBoard2D from './ChessBoard2D';
import NavigationArrows from './NavigationArrows.js';
import GameLogic from '../GameLogic';
import SANPopup from './SANPopup.js';
import SplashScreen from 'react-native-splash-screen';
import { ActivityIndicator } from 'react-native';

const ChessTutorApp = () => {
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  const gameLogicRef = useRef(new GameLogic);
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [recommendedNextMoves, setRecommendedNextMoves] = useState([]);
  const [positionAnalysis, setPositionAnalysis] = useState('');
  const [illegalMoveSquares, setIllegalMoveSquares] = useState(null);
  const [advisedMove, setAdvisedMove] = useState(null);
  const scrollViewRef = useRef(null);
  const textOpacity = useRef(new Animated.Value(1)).current;
  const thinkingOpacity = useRef(new Animated.Value(0)).current;
  const analysisComplete = useRef(false);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const chessboardSize = Math.min(windowWidth, windowHeight) * 0.9;
  const [isLandscape, setIsLandscape] = useState(false);
  const guidelineBaseWidth = 350;
  const scaleFont = (size) => (windowWidth / guidelineBaseWidth) * size;
  const [movesLeft, setMovesLeft] = useState(12);
  const [isThinking, setIsThinking] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupDescription, setPopupDescription] = useState('');
  const [displayedArrows, setDisplayedArrows] = useState([]);
  const [isPopupLoading, setIsPopupLoading] = useState(false);
  const [moveHistory, setMoveHistory] = useState([gameLogicRef.current.getFen()]); // Store FEN strings
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0); // Track current move index

  const [isWhiteTurn, setIsWhiteTurn] = useState(true); // Start with White's turn

  // Initialize the engine when the component mounts
  useEffect(() => {
    // gameLogicRef.current = new GameLogic();
    gameLogicRef.current.initializeEngine();
    // fetchAdviceAfterBlackMove();
  }, []);

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
          marginBottom: 5,
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
          fontSize: 20,
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
          marginLeft: 5,
          fontSize: 20,
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
        navigationButton: {
          backgroundColor: 'transparent',
          borderRadius: 10,
          padding: 5,
          borderWidth: 1,
          borderColor: 'white',
          marginHorizontal: 5,
        },
        navigationButtonText: {
          color: 'white',
          fontWeight: 'bold',
        },
        navigationButtonDisabled: {
          opacity: 0.5, // Dim the button when disabled
        },
        tableFooter: {
          paddingVertical: 10,
          alignItems: 'center',
          backgroundColor: '#191d24',
          borderWidth: 0,
        },
        footerText: {
          fontSize: 16,
          color: '#aec4e8',
          fontStyle: 'italic',
          fontWeight: 'bold',
        },
        spinnerContainer: {
          marginTop: 10, // Space above the spinner
          alignSelf: 'center', // Center the spinner
          justifyContent: 'center',
          alignItems: 'center',
        },
        popupSpinner: {
          marginTop: 20, // Space between description and spinner
          alignSelf: 'center',
        },
        bottomSpinnerContainer: {
          alignSelf: 'center',
          marginTop: 10, // Position under analysis
        },
        popupDescription: {
          fontSize: 18,
          color: '#ffffff',
          marginBottom: 10, // Add some space below the text
          textAlign: 'center',
        },
        popupContainer: {
          padding: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: 10,
          alignItems: 'center',
        },
        popupCloseText: {
          marginTop: 10,
          color: '#aec4e8',
          fontSize: 16,
          textDecorationLine: 'underline',
        },
        
      }),
    [windowWidth]
  );

  const handleMovePress = (sanMove, color, reasoning, respondingTo = null) => {
    const description = gameLogicRef.current.convertMoveToDescription(sanMove, color);
    const displayText = respondingTo
      ? `Response to White's ${respondingTo}:\n\n${description}`
      : `${description}\n\n${reasoning}`;
  
    setPopupDescription(displayText);
    setPopupVisible(true);
  
    if (color === 'w') {
      const moveObj = recommendedNextMoves.find((move) => move.move === sanMove);
  
      if (moveObj && moveObj.from && moveObj.to) {
        setDisplayedArrows([
          {
            from: moveObj.from,
            to: moveObj.to,
            arrowOpacity: moveObj.arrowOpacity,
          },
        ]);
      }
    } else if (color === 'b') {
      const responseMoveObj = recommendedNextMoves
        .flatMap((move) => move.likelyResponses)
        .find((response) => response.move === sanMove);
  
      if (responseMoveObj && responseMoveObj.from && responseMoveObj.to) {
        const advisingMove = recommendedNextMoves.find(
          (move) => move.move === respondingTo
        );
  
        setDisplayedArrows([
          {
            from: responseMoveObj.from,
            to: responseMoveObj.to,
            arrowOpacity: 0.6, // Arrow opacity for Black's move
          },
          advisingMove && advisingMove.from && advisingMove.to
            ? {
                from: advisingMove.from,
                to: advisingMove.to,
                arrowOpacity: 1.0, // Arrow opacity for White's advised move
              }
            : null,
        ].filter(Boolean)); // Remove any null entries
      }
    }
  };
// In your main app component

const handleBackPress = () => {
  if (currentMoveIndex >= 2) { // Ensure there are at least two moves to undo
    const newIndex = currentMoveIndex - 2;
    setCurrentMoveIndex(newIndex);
    const previousFen = moveHistory[newIndex];
    gameLogicRef.current.loadFen(previousFen);
    setBoardState(gameLogicRef.current.getBoardState());
    setIsWhiteTurn(true); // After undoing, it's White's turn
  }
};

const handleForwardPress = () => {
  if (currentMoveIndex + 2 < moveHistory.length) { // Ensure there are two moves to redo
    const newIndex = currentMoveIndex + 2;
    setCurrentMoveIndex(newIndex);
    const nextFen = moveHistory[newIndex];
    gameLogicRef.current.loadFen(nextFen);
    setBoardState(gameLogicRef.current.getBoardState());
    setIsWhiteTurn(false); // After redoing, it's Black's turn
  }
};
  
  const handleReload = () => {
    gameLogicRef.current = new GameLogic();
    gameLogicRef.current.initializeEngine();
    setBoardState(gameLogicRef.current.getBoardState());

    setSelectedSquare(null);
    setIllegalMoveSquares(null);

    setAdvisedMove(null);
    setPositionAnalysis('');
    setRecommendedNextMoves([]);
    setDisplayedArrows([]);
    setPossibleMoves([]);
 
    textOpacity.setValue(1);
    thinkingOpacity.setValue(0);

    setIsThinking(false);
    analysisComplete.current = false;
    setMoveHistory([gameLogicRef.current.getFen()]); // Replace 'initial_fen' with your actual starting FEN
    setCurrentMoveIndex(0);
    
    // Reset Turn to White
    setIsWhiteTurn(true);
    setMovesLeft(12);
    // fetchAdviceAfterBlackMove();
  };

  const onSquarePress = (position) => {
    if (isThinking) {
      return;
    }
    const selectedPiece = gameLogicRef.current.getPieceAt(position);
    if (!selectedSquare) {
      if (selectedPiece && selectedPiece.color === 'w') {
        setSelectedSquare(position);

        const legalMoves = gameLogicRef.current.getLegalMoves(position);
        const targetSquares = legalMoves.map((move) => move.to);
        setPossibleMoves(targetSquares);
      }
    } else {
      if (selectedSquare === position) {
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (selectedPiece && selectedPiece.color === 'w') {
        setSelectedSquare(position);

        const legalMoves = gameLogicRef.current.getLegalMoves(position);
        const targetSquares = legalMoves.map((move) => move.to);
        setPossibleMoves(targetSquares);
      } else {
        onMove(selectedSquare, position);
        // console.log('called onmove')
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    }
  };

  const onMove = async (fromSquare, toSquare) => {
    try {
        console.log('making white move');

        // Make the white move and update UI immediately
        const playerMove = gameLogicRef.current.makeMove_White({ from: fromSquare, to: toSquare });
        if (!playerMove) {
            setIllegalMoveSquares({ from: fromSquare, to: toSquare });
            return;
        }
        setBoardState([...gameLogicRef.current.getBoardState()]);
        console.log('made white move');
        const playerFen = gameLogicRef.current.getFen();
      // Update move history, truncating any future moves if we're adding a new move
      const updatedHistory = [...moveHistory.slice(0, currentMoveIndex + 1), playerFen];
      setMoveHistory([...updatedHistory, playerFen]);
      setCurrentMoveIndex(currentMoveIndex+1); // Move to the new move
        if (gameLogicRef.current.chess.isCheckmate()) {
            Alert.alert('Game Over', 'Checkmate! The game has ended.', [{ text: 'OK', onPress: () => handleReload() }]);
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
        //await gameLogicRef.current.engine.setBoard(this.chess.fen());
        console.log('making black move');
        const blackMoveResult = gameLogicRef.current.makeMove_Black(playerMove.san);
        setBoardState([...gameLogicRef.current.getBoardState()]);

        const engineFen = gameLogicRef.current.getFen();
        setMoveHistory([...updatedHistory, engineFen]);
        setCurrentMoveIndex(currentMoveIndex + 2);

        console.log('made black move');
        setIsThinking(true);
        fetchMovesAfterBlackMove();

        setIsWhiteTurn(true); // After moves, it's Black's turn    ???????

        // await fetchReasoningAfterBlackMove();
        // Hide thinking animation after advice is retrieved
        setIsThinking(false);
    } catch (error) {
        console.log('Error during move:', error);
        Alert.alert('Error', 'Error processing move, please try again.', [{ text: 'OK' }]);
        setIllegalMoveSquares({ from: fromSquare, to: toSquare });
    }
};


  const fetchMovesAfterBlackMove = () => {
    // console.log(`getting table data`);
    const tableData = gameLogicRef.current.getTableData();
    console.log(`table data: ${JSON.stringify(tableData, null, 2)}`);

    if (!tableData || tableData.length === 0) {
        console.log('Error: Table data is empty or undefined.');
        setPositionAnalysis('');
        setRecommendedNextMoves([]);
        setDisplayedArrows([]);
        analysisComplete.current = false;
        return;
    }

    // Save the latest advice in GameLogic
    gameLogicRef.current.latestAdvice = tableData;
// console.log('calling render');
    // Use renderMoveAdvice to process the tableData
    const processedAdvice = renderAdvisedMoves(tableData);
// console.log('called render');

    // Update the state with processed advice
// console.log('calling setrecommended');

    setRecommendedNextMoves(processedAdvice);
    // console.log('called setrecommended');

    // console.log('calling display arrows');

    setDisplayedArrows(
      processedAdvice.map((move) => ({
        from: move.from,
        to: move.to,
        arrowOpacity: move.arrowOpacity,
      }))
    );
    // console.log('called display arrows');

// console.log('calling set pos analysis');

    setPositionAnalysis('Game analysis based on table data.');
// console.log('called set pos analysis');

    analysisComplete.current = true;

    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const fetchReasoningAfterBlackMove = async () => {
    try {
      setIsPopupLoading(true); // Show spinner in popup
      const apiName = 'Claude';
      const advisedMoves = gameLogicRef.current.latestAdvice;
  
      if (!advisedMoves) {
        console.log('No advised moves available for reasoning.');
        setIsPopupLoading(false); // Ensure spinner stops if no advice
        return;
      }
  
      const reasoningData = await gameLogicRef.current.getReasoningFromAI(apiName, advisedMoves);
  
      // Hide spinner and update popup
      setPopupDescription(reasoningData.positionAnalysis || 'Reasoning returned.');
      setIsPopupLoading(false);
  
      // Update advice with reasoning
      const updatedAdvice = advisedMoves.map((move, index) => ({
        ...move,
        reasoning: reasoningData.reasoning[index] || move.reasoning,
      }));
  
      gameLogicRef.current.latestAdvice = updatedAdvice;
  
      // Re-process advice
      const processedAdvice = renderAdvisedMoves(updatedAdvice);
      setRecommendedNextMoves(processedAdvice);
      setPositionAnalysis(reasoningData.positionAnalysis);
      analysisComplete.current = true;
    } catch (error) {
      console.error('Error fetching reasoning:', error);
      setIsPopupLoading(false); // Ensure spinner stops on error
    }
  };
  

  function attachReasoningToAdvice(advice, reasoningData) {
    const { reasoning } = reasoningData;
    return advice.map((move, index) => ({
      ...move,
          reasoning: reasoning[index] || 'No reasoning provided'
    }));
  }
  
  function renderAdvisedMoves(advice) {
      console.log('advice ', advice);
    return advice.map((move) => {
      let arrowOpacity = 1.0;
      const moveSan = move.san;
      let moveLabel = moveSan;
      // if (move.reasoning.includes('Significant')) {
      //     arrowOpacity = 1.0; // Strongest
      //     moveLabel = `${moveSan} (STRONGEST)`;
      // } else if (move.reasoning.includes('Controls')) {
      //     arrowOpacity = 0.8; // Stronger
      //     moveLabel = `${moveSan} (STRONGER)`;
      // } else {
          arrowOpacity = 1; // Strong
          moveLabel = `${moveSan} (STRONG)`;
      // }
      const blackResponses = move.likelyResponses.map((response) => ({
          
          move: response.san, // Black's likely response
          from: response.move.slice(0, 2),
          to: response.move.slice(2),
          arrowOpacity: 0.6, // Default arrow opacity for responses
      }));
      return {
          move: moveLabel,
          reasoning: move.reasoning || 'No reasoning provided',
          likelyResponses: blackResponses,
          arrowOpacity,
          from: move.move.slice(0, 2), // Extract "from"
          to: move.move.slice(2), // Extract "to"
          originalMove: moveSan,
      };
    });
  }

  useEffect(() => {
    setIsLandscape(windowWidth > windowHeight);
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

      <NavigationArrows
  onBackPress={handleBackPress}
  onForwardPress={handleForwardPress}
  disableBack={currentMoveIndex < 2 || !isWhiteTurn}
  disableForward={currentMoveIndex + 2 >= moveHistory.length || !isWhiteTurn}
/>  
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
                          {move.likelyResponses.map((response, idx) => (
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
  
        {/* Spinner Below Game Analysis */}
        {isThinking && (
          <View style={styles.bottomSpinnerContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}
      </View>
  
      {/* Popups */}
      <SANPopup
  visible={popupVisible}
  description={popupDescription}
  onClose={() => {
    setPopupVisible(false);
    setDisplayedArrows([]);
  }}
  isLoading={isPopupLoading}
/>
    </SafeAreaView>
  );
  
  
};

export default ChessTutorApp;
