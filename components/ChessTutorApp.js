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
  const gameLogicRef = useRef(new GameLogic());
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
  const positionAnalysisExtracted = useRef(false);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const chessboardSize = Math.min(windowWidth, windowHeight) * 0.9;
  const [isLandscape, setIsLandscape] = useState(false);
  const guidelineBaseWidth = 350; // Base width for scaling fonts
  const scaleFont = (size) => (windowWidth / guidelineBaseWidth) * size;
  const [movesLeft, setMovesLeft] = useState(12);
  const [isThinking, setIsThinking] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupDescription, setPopupDescription] = useState('');
  const [displayedArrows, setDisplayedArrows] = useState([]);
  async function initializeApiKeys() {
    await gameLogicRef.current.removeApiKey();
    await gameLogicRef.current.storeApiKey('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');
  }

  useEffect(() => {
    initializeApiKeys();
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
  const handleMovePress = (sanMove, color, reasoning, respondingTo = null) => {
    const description = gameLogicRef.current.convertMoveToDescription(sanMove, color);
    const displayText = respondingTo
      ? `Response to White's ${respondingTo}:\n\n${description}\n\n${reasoning}`
      : `${description}\n\n${reasoning}`;
    setPopupDescription(displayText);
    setPopupVisible(true);
    if (color === 'w') {
      const moveObj = recommendedNextMoves.find((move) => move.originalMove === sanMove);
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
      const advisedMoveObj = recommendedNextMoves.find((move) => move.originalMove === respondingTo);
      const responseMoveObj = advisedMoveObj.blackResponses.find((response) => response.move === sanMove);
      let arrows = [];
      if (advisedMoveObj && advisedMoveObj.from && advisedMoveObj.to) {
        arrows.push({
          from: advisedMoveObj.from,
          to: advisedMoveObj.to,
          arrowOpacity: advisedMoveObj.arrowOpacity,
        });
      }
      if (responseMoveObj && responseMoveObj.from && responseMoveObj.to) {
        arrows.push({
          from: responseMoveObj.from,
          to: responseMoveObj.to,
          arrowOpacity: 1.0, // Full opacity for Black's move
        });
      }
      setDisplayedArrows(arrows);
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
    setIsThinking(false);
    analysisComplete.current = false;    // Set analysis as incomplete
    positionAnalysisExtracted.current = false;    // Set position analysis as not extracted
    setMovesLeft(12);    // Reset moves left
  };

  const onSquarePress = (position) => {    // Function to handle when a square is pressed
    if (isThinking) {      // Do nothing if AI is thinking
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
        setSelectedSquare(null);  
        setPossibleMoves([]);    
      }
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
      setMovesLeft((prevMoves) => prevMoves - 1);
      if (gameLogicRef.current.chess.isCheckmate()) {
        Alert.alert('Game Over', 'Checkmate! The game has ended.', [{ text: 'OK', onPress: () => handleReload() }]);
        return;
      }
      setDisplayedArrows([]);
      const blackMoveResult = await gameLogicRef.current.makeMove_Black();
      if (!blackMoveResult || !blackMoveResult.move) {
        console.log('AI failed to make a move for Black, making random move.');
        const randomMove = gameLogicRef.current.selectRandomMove();
        blackMoveResult = gameLogicRef.current.makeMove_Black(randomMove);
        if (!blackMoveResult) {
          Alert.alert("Computer's move failed.", 'Please try again.', [{ text: 'OK' }]);
          return;
        }
      }
        setBoardState([...gameLogicRef.current.getBoardState()]);
        await fetchMovesAfterBlackMove();
        fetchReasoningAfterBlackMove();
    } catch (error) {
      console.log('Error during move:', error);
      Alert.alert('Error', 'Error processing move, please try again.', [{ text: 'OK' }]);
      setIllegalMoveSquares({ from: fromSquare, to: toSquare });
    }
  };

  const fetchMovesAfterBlackMove = async () => {
    setIsThinking(true);
    const apiName = 'GPT';
    const advised_moves = await gameLogicRef.current.getMovesFromAI(apiName);
    setIsThinking(false);
    if (!advised_moves) {
      console.log('Failed to fetch moves from AI.');
      return;
    }
    console.log(`advised_moves: ${JSON.stringify(advised_moves,null,2)}`);    
    gameLogicRef.current.latestAdvice = advised_moves;
    const processedAdvisedMoves = renderAdvisedMoves(advised_moves);
        console.log(`processedAdvisedMoves: ${processedAdvisedMoves}`);

    setRecommendedNextMoves(processedAdvisedMoves);
    setDisplayedArrows(
      processedAdvisedMoves.map((move) => ({
        from: move.from,
        to: move.to,
        arrowOpacity: move.arrowOpacity,
      }))
    );
    // setPositionAnalysis(advice.positionAnalysis);
    // analysisComplete.current = true;
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const fetchReasoningAfterBlackMove = async () => {
    const apiName = 'Claude';
      // Get the previously stored moves from gameLogicRef.current.latestAdvice
    const advisedMoves = gameLogicRef.current.latestAdvice;
    if (!advisedMoves) {
      console.log('No advised moves available for reasoning.');
      return;
    }
    const reasoningData = await gameLogicRef.current.getReasoningFromAI(apiName,advisedMoves);
    console.log(`reasoningdata: ${JSON.stringify(reasoningData)}`);
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
    return advice.recommendedNextMoves.map((move) => {
      let arrowOpacity = 1.0;
      let moveLabel = move.move;
      switch (move.priority) {
        case 'STRONG':
          arrowOpacity = 0.5;
          moveLabel = `${move.move} (STRONG)`;
          break;
        case 'STRONGER':
          arrowOpacity = 0.8;
          moveLabel = `${move.move} (STRONGER)`;
          break;
        case 'STRONGEST':
          arrowOpacity = 1;
          moveLabel = `${move.move} (STRONGEST)`;
          break;
        default:
          arrowOpacity = 1.0;
      }

      // Get move details for the advised move
      const moveDetails = gameLogicRef.current.getMoveDetailsFromSAN(move.move);
      let from = null;
      let to = null;
      let newFEN = null;
      if (moveDetails) {
        from = moveDetails.from;
        to = moveDetails.to;

        // Make the advised move to get the new FEN
        gameLogicRef.current.chess.move(move.move);
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
        reasoning: move.reasoning || 'Reasoning not yet available.',
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
              ) : (
                <Text style={styles.analysisText}>Fetching analysis...</Text>
              )}
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
