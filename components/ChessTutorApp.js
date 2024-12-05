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
import GameLogic from '../GameLogic';
import SANPopup from './SANPopup.js';
import SplashScreen from 'react-native-splash-screen';

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
      const playerMove = gameLogicRef.current.makeMove_White({ from: fromSquare, to: toSquare });
      if (!playerMove) {
        setIllegalMoveSquares({ from: fromSquare, to: toSquare });
        return;
      }
      setBoardState([...gameLogicRef.current.getBoardState()]);
      console.log('made white move');

      setMovesLeft((prevMoves) => prevMoves - 1);
      if (gameLogicRef.current.chess.isCheckmate()) {
        Alert.alert('Game Over', 'Checkmate! The game has ended.', [{ text: 'OK', onPress: () => handleReload() }]);
        return;
      }
      setDisplayedArrows([]); 
      setIsThinking(true);

      setTimeout(() => {
      //   console.log('making black move');
        const blackMoveResult = gameLogicRef.current.makeMove_Black(playerMove.san);
        // console.log('Engine failed to make a move for Black, making random move.');
        // const randomMove = gameLogicRef.current.selectRandomMove();
        // gameLogicRef.current.chess.move(randomMove);
        setBoardState([...gameLogicRef.current.getBoardState()]);
        console.log('made black move');
      }, 1500); // 1 second delay
      console.log('getting advised moves');
      await fetchMovesAfterBlackMove();
      console.log('got advised moves');

      setIsThinking(false);
      console.log('getting reasoning');
      fetchReasoningAfterBlackMove();
      console.log('got reasoning');      
    } catch (error) {
      console.log('Error during move:', error);
      Alert.alert('Error', 'Error processing move, please try again.', [{ text: 'OK' }]);
      setIllegalMoveSquares({ from: fromSquare, to: toSquare });
    }
  };

  const fetchMovesAfterBlackMove = () => {
    console.log(`getting table data`);
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
console.log('calling render');
    // Use renderMoveAdvice to process the tableData
    const processedAdvice = renderAdvisedMoves(tableData);
console.log('called render');

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
    const apiName = 'Claude';
    const advisedMoves = gameLogicRef.current.latestAdvice;
    if (!advisedMoves) {
      console.log('No advised moves available for reasoning.');
      return;
    }
    const reasoningData = await gameLogicRef.current.getReasoningFromAI(apiName,advisedMoves);
    console.log(`fetchReasoningAfterBlackMove.reasoningdata: ${JSON.stringify(reasoningData)}`);
    if (!reasoningData) {
      console.log('Failed to fetch reasoning from AI.');
      return;
    }
    // Update the advice with reasoning
    const updatedAdvice = {
      ...gameLogicRef.current.latestAdvice,
      positionAnalysis: reasoningData.positionAnalysis,
      recommendedNextMoves: gameLogicRef.current.latestAdvice.recommendedNextMoves.map((move, index) => ({
        ...move,
        reasoning: reasoningData.reasoning[index] || move.reasoning,
      })),
    };
    gameLogicRef.current.latestAdvice = updatedAdvice;
    // Re-process the advice to include reasoning
    const processedAdvice = renderAdvisedMoves(updatedAdvice);
    setRecommendedNextMoves(processedAdvice);
    setPositionAnalysis(updatedAdvice.positionAnalysis);
    analysisComplete.current = true;
  };






  function renderAdvisedMoves(advice) {
    // console.log(advice[0]);
    return advice.map((move) => {
      let arrowOpacity = 1.0;
      const moveSan = move.san;
      let moveLabel = moveSan;
      // console.log(`entry: ${JSON.stringify(entry, null, 2)}`)
      // Assign priorities based on reasoning or other criteria (customizable)
      if (move.reasoning.includes('Significant')) {
          arrowOpacity = 1.0; // Strongest
          moveLabel = `${moveSan} (STRONGEST)`;
      } else if (move.reasoning.includes('Controls')) {
          arrowOpacity = 0.8; // Stronger
          moveLabel = `${moveSan} (STRONGER)`;
      } else {
          arrowOpacity = 0.5; // Strong
          moveLabel = `${moveSan} (STRONG)`;
      }

      // Process the likely responses (optional)
      //console.log(entry.likelyResponses);
      const blackResponses = move.likelyResponses.map((response) => ({
          move: response.san, // Black's likely response
          arrowOpacity: 0.6, // Default arrow opacity for responses
      }));
      // const moveList = gameLogicRef.current.chess.moves({ verbose: true });
      // const matchingMove = moveList.find((m) => m === entry.move);
      const fromAlgebraic = gameLogicRef.current.indexToAlgebraic(move.move.from);
      const toAlgebraic = gameLogicRef.current.indexToAlgebraic(move.move.to);
      
      //  console.log(moveLabel);
      //  console.log(entry.reasoning);
      //  console.log(blackResponses);
      //  console.log(arrowOpacity);
      //  console.log(fromAlgebraic); 
      //  console.log(toAlgebraic);
      
      return {
          move: moveLabel,
          reasoning: move.reasoning || 'No reasoning provided',
          likelyResponses: blackResponses,
          arrowOpacity,
          from: fromAlgebraic, // Extract "from"
          to: toAlgebraic, // Extract "to"
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
                          {/* Black responses are not generated in this setup */}
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
          setPopupVisible(false);
          setDisplayedArrows(
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
