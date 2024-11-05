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
import { ActivityIndicator } from 'react-native';
import SANPopup from './SANPopup.js'; 

const ChessTutorApp = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [recommendedNextMoves, setRecommendedNextMoves] = useState([]);
  const [positionAnalysis, setPositionAnalysis] = useState({
    immediateTactics: '',
    lastMoveAnalysis: '',
  });
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
  const guidelineBaseWidth = 350; // Base width
  const scaleFont = (size) => (windowWidth / guidelineBaseWidth) * size;
  const [movesLeft, setMovesLeft] = useState(12); // Starting from 12 half-moves
  const [isThinking, setIsThinking] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupDescription, setPopupDescription] = useState('');


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
          width: '95%',
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
      }),
    [windowWidth]
  );

  const handleMovePress = (sanMove, color, reasoning, respondingTo = null) => {
    const descript = gameLogicRef.current.convertMoveToDescription(sanMove, color);
    const displayText = respondingTo
        ? `Response to White's ${respondingTo}:\n\n${descript}\n\n${reasoning}`
        : `${descript}\n\n${reasoning}`;
    console.log(`san ${sanMove} - 
      color ${color} - 
      reasoning ${reasoning} - 
      description ${descript} -
      respondingTo ${respondingTo}`)
    setPopupDescription(displayText);
    setPopupVisible(true);
  };

  const handleReload = () => {
    gameLogicRef.current = new GameLogic();
    setBoardState(gameLogicRef.current.getBoardState());
    setSelectedSquare(null);
    setIllegalMoveSquares(null);
    setAdvisedMove(null);
    setPositionAnalysis({
      immediateTactics: '',
      lastMoveAnalysis: '',
    });
    setRecommendedNextMoves([]);
    textOpacity.setValue(1);
    thinkingOpacity.setValue(0);
    analysisComplete.current = false;
    setMovesLeft(12); // Reset moves left
  };

  const onSquarePress = (position) => {
    if (isThinking) {
      return;
    }
    const selectedPiece = gameLogicRef.current.getPieceAt(position);

    if (!selectedSquare) {
      // No piece is currently selected
      if (selectedPiece && selectedPiece.color === 'w') {
        // Only allow selecting white pieces
        setSelectedSquare(position);
        const legalMoves = gameLogicRef.current.getLegalMoves(position);
        const targetSquares = legalMoves.map((move) => move.to);
        setPossibleMoves(targetSquares);
      }
    } else {
      if (selectedSquare === position) {
        // User tapped on the selected square again; deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (selectedPiece && selectedPiece.color === 'w') {
        // User selected a different white piece; update selection
        setSelectedSquare(position);
        const legalMoves = gameLogicRef.current.getLegalMoves(position);
        const targetSquares = legalMoves.map((move) => move.to);
        setPossibleMoves(targetSquares);
      } else {
        // Attempt to make a move
        onMove(selectedSquare, position);
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    }
  };

  const onMove = async (fromSquare, toSquare) => {
    try {      // Player (White) makes a move
      const playerMove = gameLogicRef.current.makeMove({ from: fromSquare, to: toSquare });
      if (!playerMove) {
        setIllegalMoveSquares({ from: fromSquare, to: toSquare });
        return;
      }
      if (gameLogicRef.current.chess.isCheckmate()) {
        Alert.alert('Game Over', 'Checkmate! The game has ended.', [{ text: 'OK', onPress: () => handleReload() }]);
        return;
      }
      setBoardState([...gameLogicRef.current.getBoardState()]);
      setRecommendedNextMoves([]);
      setIllegalMoveSquares(null);
      setMovesLeft((prevMoves) => prevMoves - 1);
      if (movesLeft - 1 <= 0) {
        Alert.alert('Opening Phase Complete', 'You have completed the opening phase. Great job practicing your openings!', [
          { text: 'OK', onPress: () => handleReload() },
        ]);

        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
      setIsThinking(true);
      Animated.timing(textOpacity, {      // Start the thinking animation
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(thinkingOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
      let blackMoveResult = await gameLogicRef.current.makeMove_Black();      // Make Black's move
      if (!blackMoveResult || !blackMoveResult.move) {
        console.log('AI failed to make a move for Black, making random move.');
        const randomMove = gameLogicRef.current.selectRandomMove();
        blackMoveResult = gameLogicRef.current.makeMove_Black(randomMove);
        if (!blackMoveResult) {
          Alert.alert("Computer's move failed.", 'Please try again.', [{ text: 'OK' }]);
          return;
        }
      }
      if (gameLogicRef.current.chess.isCheckmate()) {
        Alert.alert('Game Over', 'Checkmate! The game has ended.', [{ text: 'OK', onPress: () => handleReload() }]);
        return;
      }
      // Update the board state after Black's move
      setBoardState([...gameLogicRef.current.getBoardState()]);
      // Fetch advice from the AI
      const apiName = 'Claude';
      let advice = await gameLogicRef.current.getAdviceFromAPI(apiName);
      //console.log("First Move API Response:", advice);
      if (advice && advice.recommendedNextMoves) {
        const chess = gameLogicRef.current.chess;
        const legalMoves = chess.moves({ verbose: true });
          // Remove duplicates and illegals
        advice.recommendedNextMoves = advice.recommendedNextMoves.filter((move, index, self) => {
          const isUnique = index === self.findIndex((m) => m.move === move.move);
          const isLegal = legalMoves.some((legalMove) => legalMove.san === move.move);
          //const isPriority = move.priority !== 'OPTIONAL';
          return isUnique && isLegal ;
          //return isUnique && isLegal && isPriority;          
        });
        // for each move, filter its responses
        // advice.recommendedNextMoves = advice.recommendedNextMoves.map(moveObj => {
        //   const newPosition = chess.move(moveObj.move);  
        //   const blackLegalMoves = chess.moves({ verbose: true });
        //   chess.undo();  
        //   // Filter the responses      // Remove duplicates      // Check if the response is legal in the resulting position
        //   const filteredResponses = moveObj.blackResponses.filter((response, index, self) => {
        //     const isUnique = index === self.findIndex((r) => r === response);
        //     const isLegal = blackLegalMoves.some((legalMove) => legalMove.san === response);
        //     return isUnique && isLegal;
        //   });
        //   // Return the move object with filtered responses
        //   console.log(` ___ ${moveObj.blackResponses}`);
          
        //   return {...moveObj, blackResponses: filteredResponses};
        // });

// Optional: Remove any moves that end up with no legal responses
// advice.recommendedNextMoves = advice.recommendedNextMoves.filter(
//   moveObj => moveObj.blackResponses.length > 0
// );


        
        // Use a deep copy for setting state
        //  setRecommendedNextMoves(JSON.parse(JSON.stringify(legalMoves)));
      //   useEffect(() => {
      //     console.log("Updated Recommended Moves:", recommendedNextMoves);
      // }, [recommendedNextMoves]);
      }
      setIsThinking(false);
      if (!advice) {
        setPositionAnalysis({immediateTactics: '',lastMoveAnalysis: '',});
        setRecommendedNextMoves([]);
        return;
      } else {        // Store the latest advice in GameLogic
        gameLogicRef.current.latestAdvice = advice;
      }
      Animated.timing(thinkingOpacity, {      // Stop the thinking animation and display the advice
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setPositionAnalysis(advice.positionAnalysis);
        //setRecommendedNextMoves(advice.recommendedNextMoves);
        if (advice) {          // Process the advice to adjust move labels and arrow opacity
          const processedAdvice = renderMoveAdvice(advice);
          setRecommendedNextMoves(processedAdvice);
          gameLogicRef.current.latestAdvice = advice;          // Store the latest advice in GameLogic
        }
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          analysisComplete.current = true;
        });
      });
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error) {
      console.error('Error during move:', error);
      Alert.alert('Error', 'Error processing move, please try again.', [{ text: 'OK' }]);
      setIllegalMoveSquares({ from: fromSquare, to: toSquare });
      setIsThinking(false);
    }
    // console.log("recommendedNextMoves:", recommendedNextMoves);
  };
  function renderMoveAdvice(advice) {
    return advice.recommendedNextMoves.map((move) => {
      let arrowOpacity = 1.0; // Default to fully opaque arrows
      let moveLabel = move.move; // Original move label
  
      // Adjust arrow opacity and move label based on priority
      switch (move.priority) {
        case 'FORCED':
          arrowOpacity = 1.0;
          moveLabel = `${move.move} (FORCED)`;
          break;
        case 'STRONG':
          arrowOpacity = 0.8;
          moveLabel = `${move.move} (STRONG)`;
          break;
        case 'OPTIONAL':
          arrowOpacity = .1;
          moveLabel = `${move.move} (OPTIONAL)`;
          break;
        default:
          arrowOpacity = 1.0;
      }
  
      return {
        ...move,
        move: moveLabel,         // Move label with priority
        arrowOpacity: arrowOpacity,
        originalMove: move.move, // Keep the original move without labels
      };
    });
  }
  const getRecommendedMovesForArrows = () => {
    if (!Array.isArray(recommendedNextMoves) || recommendedNextMoves.length === 0) {
      return [];
    }
    return recommendedNextMoves
      .map((move) => {
        const moveSan = move.originalMove; // Use originalMove without priority labels
        const chess = gameLogicRef.current.chess;
        const moves = chess.moves({ verbose: true });
        const moveObj = moves.find((m) => m.san === moveSan);
  
        if (moveObj) {
          return {
            from: moveObj.from,
            to: moveObj.to,
            arrowOpacity: move.arrowOpacity,
          };
        } else {
          console.error('Invalid advised move:', moveSan);
          return null;
        }
      })
      .filter((move) => move !== null);
  };
  

  useEffect(() => {
    setIsLandscape(windowWidth > windowHeight); // Detect if the device is in landscape mode
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
            possibleMoves={possibleMoves}
            recommendedMoves={getRecommendedMovesForArrows()}
            isThinking={isThinking}
          />
        </View>
        {/* Analysis texts */}
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.textContainer}>
          <Animated.View style={[styles.analysisContainer, { opacity: textOpacity }]}>
          {Array.isArray(recommendedNextMoves) && recommendedNextMoves.length > 0 ? (
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.adviceColumn]}>Advice</Text>
                  <Text style={[styles.tableCell, styles.tableHeader, styles.responseColumn]}>Likely Responses</Text>
                </View>
                {Array.isArray(recommendedNextMoves) && recommendedNextMoves.length > 0 ? (
                recommendedNextMoves.map((move, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.tableCell, styles.adviceColumn]}>
                      <TouchableOpacity onPress={() => handleMovePress(move.originalMove, 'w', move.reasoning)} >
                          <Text style={styles.tappableMove}>{move.move}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.tableCell, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                      {move.blackResponses.map((response, idx) => (
                        <TouchableOpacity key={idx} onPress={() =>
                          handleMovePress(response.move, 'b', response.threat, move.originalMove)
                          } >
                          <Text style={styles.tappableMove}>{response.move}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))) : (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>No advice available</Text>
                    <Text style={styles.tableCell}>N/A</Text>
                  </View>
                )}                
              </View>
            </SafeAreaView>
            ) : (
              <Text style={styles.noDataText}>Make your move.</Text>
            )}
            {positionAnalysis.immediateTactics || positionAnalysis.lastMoveAnalysis ? (
              <View>
                {positionAnalysis.immediateTactics ? (
                  <View>
                    <Text style={styles.analysisTitle}>Immediate Tactics:</Text>
                    <Text style={styles.analysisText}>{positionAnalysis.immediateTactics}</Text>
                  </View>
                ) : null}
                {positionAnalysis.lastMoveAnalysis ? (
                  <View>
                    <Text style={styles.analysisTitle}>Last Move Analysis:</Text>
                    <Text style={styles.analysisText}>{positionAnalysis.lastMoveAnalysis}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>
        {/* Thinking overlay */}
        {isThinking && (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.overlayText}>Thinking...</Text>
          </View>
        )}
      </View>
      <SANPopup
                visible={popupVisible}
                description={popupDescription}
                onClose={() => setPopupVisible(false)}
      />
    </SafeAreaView>
  ); 
};

export default ChessTutorApp;