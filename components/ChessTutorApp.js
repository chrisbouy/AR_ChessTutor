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
  FlatList,
} from 'react-native';
import ChessBoard2D from './ChessBoard2D';
import GameLogic from '../GameLogic';

const ChessTutorApp = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [openingName, setOpeningName] = useState('');
  const [openingAnalysis, setOpeningAnalysis] = useState('');
  const [recommendedNextMoves, setRecommendedNextMoves] = useState([]);
  const [illegalMoveSquares, setIllegalMoveSquares] = useState(null);
  const [advisedMove, setAdvisedMove] = useState(null);
  const scrollViewRef = useRef(null); // Create a ref for the ScrollView
  const textOpacity = useRef(new Animated.Value(1)).current;
  const thinkingOpacity = useRef(new Animated.Value(0)).current;
  const analysisComplete = useRef(false);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const chessboardSize = Math.min(windowWidth, windowHeight) * 0.9;
  const [isLandscape, setIsLandscape] = useState(false);
  const guidelineBaseWidth = 350; // Base width
  const scaleFont = (size) => (windowWidth / guidelineBaseWidth) * size;
  const [movesLeft, setMovesLeft] = useState(20); // Starting from 20 half-moves
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: '#191d24',
          // justifyContent: 'center',
          // alignItems: 'center',
        },
        reloadButtonContainer: {
          padding: 0,
          backgroundColor: '#191d24',
          marginRight:2
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
        prefixText: {
          fontWeight: 'bold',
          fontSize: scaleFont(20),
          color: '#ffffff',
        },
        openingName: {
          fontSize: scaleFont(26),
          color: '#aec4e8',
          textAlign: 'center',
          marginBottom: 15,
        },
        openingAnalysis: {
          fontSize: scaleFont(18),
          marginTop: 25,
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
        moveCounterContainer: {

          top: 0,
          left: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
          backgroundColor: '#191d24', // Deep black background
        },
        tableContainer: {
          width: '90%', // Ensure table fits within the screen
          borderWidth: 1,
          borderColor: 'white',
          borderRadius: 8,
          overflow: 'hidden',
        },
        tableRow: {
          flexDirection: 'row', // Align cells horizontally
          borderBottomWidth: 1,
          borderColor: 'white',
        },
        tableCell: {
          flex: 1, // Distribute space evenly between cells
          padding: 10,
          fontSize: 16,
          color: '#aec4e8',
          textAlign: 'center',
          borderRightWidth: 1,
          borderColor: 'white',
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
        }
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
    setMovesLeft(12); // Reset moves left
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
      // Player (White) makes a move
      const playerMove = gameLogicRef.current.makeMove({ from: fromSquare, to: toSquare });
      if (!playerMove) {
        setIllegalMoveSquares({ from: fromSquare, to: toSquare });
        return;
      }
      setBoardState([...gameLogicRef.current.getBoardState()]);
      setIllegalMoveSquares(null);
      setMovesLeft((prevMoves) => prevMoves - 1);
      if (movesLeft - 1 <= 0) {
        Alert.alert('Game Over', 'You have reached the maximum number of moves for the opening phase.');
        return;
      }
  
      // Start the thinking animation
      Animated.timing(textOpacity, {
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
  
      // Make Black's move
      let blackMoveResult = await gameLogicRef.current.makeMove_Black();
      if (!blackMoveResult || !blackMoveResult.move) {
        console.log('AI failed to make a move for Black, making random move.');
        const randomMove = gameLogicRef.current.selectRandomMove();
        blackMoveResult = gameLogicRef.current.makeMove_Black(randomMove);
        if (!blackMoveResult) {
          setOpeningName("Computer's move failed.");
          return;
        }
      }
  
      // Update the board state after Black's move
      setBoardState([...gameLogicRef.current.getBoardState()]);
      setMovesLeft((prevMoves) => prevMoves - 1);
      if (movesLeft - 1 <= 0) {
        Alert.alert(
          'Opening Phase Complete',
          'You have completed the opening phase. Great job practicing your openings!',
          [{ text: 'OK', onPress: () => {} }]
        );
        return;
      }
  
      // Fetch advice from the AI
      const apiName = 'GPT'; // Or 'Gemini', depending on your choice
      const advice = await gameLogicRef.current.getAdviceFromAPI(apiName);
  
      if (!advice) {
        setOpeningName('Failed to get advice from AI');
        setRecommendedNextMoves([]);
        setOpeningAnalysis('');
        return;
      } else {
        // Store the latest advice in GameLogic
        gameLogicRef.current.latestAdvice = advice;
      }
  
      // Stop the thinking animation and display the advice
      Animated.timing(thinkingOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setOpeningName(advice.openingName);
        setRecommendedNextMoves(advice.recommendedNextMoves);
        setOpeningAnalysis(advice.openingAnalysis);
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
  const renderRow = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.whiteMove}</Text>
      <Text style={styles.tableCell}>{item.blackResponses.join(', ')}</Text>
    </View>
  );
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
          />
        </View>

        {/* Analysis texts */}
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.textContainer}>
          <Animated.View style={[styles.analysisContainer, { opacity: textOpacity }]}>
            
            {/* {openingName ? (
              <Text style={styles.openingName}>{openingName}</Text>
            ) : null
            } */}

            {recommendedNextMoves.length > 0 ? (
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableHeader]}>Advice</Text>
                  <Text style={[styles.tableCell, styles.tableHeader]}>Likely Responses</Text>
                </View>

                {Array.isArray(recommendedNextMoves) && recommendedNextMoves.length > 0 ? (
                  recommendedNextMoves.map((move, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{move.whiteMove}</Text>
                        <Text style={styles.tableCell}>{move.blackResponses.join(', ')}</Text>
                      </View>
                    ))
                ) : (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>No advice available</Text>
                    <Text style={styles.tableCell}>N/A</Text>
                  </View>
                )}
              </View>
            </SafeAreaView>
              ) : (  <Text style={styles.noDataText}>Make your move.</Text>  )
              }

            {openingAnalysis ? (
              <Text style={styles.openingAnalysis}>
                <Text style={styles.prefixText}>Opening Analysis:{'\n'}</Text>
                {openingAnalysis}
              </Text>
            ) : null
            }


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

export default ChessTutorApp;
