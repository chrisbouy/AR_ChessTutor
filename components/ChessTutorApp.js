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
  ActivityIndicator,
  Linking, 
  Platform,
  Image
} from 'react-native';
import ChessBoard2D from './ChessBoard2D';
import NavigationArrows from './NavigationArrows.js';
import GameLogic from '../GameLogic';
import SANPopup from './SANPopup.js';
import SplashScreen from 'react-native-splash-screen';
import { checkSubscriptionStatus, subscribeToAI } from '../services/Subscriptions';

const ChessTutorApp = () => {
  // useEffect(() => {
  //   SplashScreen.hide();
  // }, []);

  const gameLogicRef = useRef(new GameLogic);
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [recommendedNextMoves, setRecommendedNextMoves] = useState([]);
  const [positionAnalysis, setPositionAnalysis] = useState('');
  const [illegalMoveSquares, setIllegalMoveSquares] = useState(null);
  const [advisedMove, setAdvisedMove] = useState(null);
  const scrollViewRef = useRef(null);
  const textOpacity = useRef(new Animated.Value(1)).current;
  const thinkingMovesOpacity = useRef(new Animated.Value(0)).current;
  const thinkingAnalysisOpacity = useRef(new Animated.Value(0)).current;
  const analysisComplete = useRef(false);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const chessboardSize = Math.min(windowWidth, windowHeight) * 0.9;
  const [isLandscape, setIsLandscape] = useState(false);
  const guidelineBaseWidth = 350;
  const scaleFont = (size) => (windowWidth / guidelineBaseWidth) * size;
  const [movesLeft, setMovesLeft] = useState(12);
  const [isThinkingMoves, setIsThinkingMoves] = useState(false);
  const [isThinkingAnalysis, setIsThinkingAnalysis] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupDescription, setPopupDescription] = useState('');
  const [displayedArrows, setDisplayedArrows] = useState([]);
  const [isPopupLoading, setIsPopupLoading] = useState(false);
  const [currentAdviceIndex, setCurrentAdviceIndex] = useState(0);
  const [adviceHistory, setAdviceHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0); // Track current move index
  const [currentAdvice, setCurrentAdvice] = useState(null); // Current advice to display
  const [isWhiteTurn, setIsWhiteTurn] = useState(true); // Start with White's turn
  const [hasAIFeature, setHasAIFeature] = useState(false);
  const pieceAssets = {
    P: require('../assets/images/2d_chess_pieces/white-pawn.png'),
    N: require('../assets/images/2d_chess_pieces/white-knight.png'),
    B: require('../assets/images/2d_chess_pieces/white-bishop.png'),
    R: require('../assets/images/2d_chess_pieces/white-rook.png'),
    Q: require('../assets/images/2d_chess_pieces/white-queen.png'),
    p: require('../assets/images/2d_chess_pieces/black-pawn.png'),
    n: require('../assets/images/2d_chess_pieces/black-knight.png'),
    b: require('../assets/images/2d_chess_pieces/black-bishop.png'),
    r: require('../assets/images/2d_chess_pieces/black-rook.png'),
    q: require('../assets/images/2d_chess_pieces/black-queen.png'),
  };
  const [capturedMaterial, setCapturedMaterial] = useState({
    white: {}, // Initialize with an empty object for white pieces
    black: {}, // Initialize with an empty object for black pieces
  });
  const [recentMoves, setRecentMoves] = useState([]);
 
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize the chess engine
      gameLogicRef.current.initializeEngine();
  
      // Check subscription status
      const hasSubscription = await checkSubscriptionStatus();
      setHasAIFeature(hasSubscription);
      if (hasSubscription) {
        console.log('AI feature is enabled');
      } else {
        console.log('AI feature is disabled');
      }
    };
  
    initializeApp();
  }, []);
  
  useEffect(() => {
    // Ensure gameLogicRef and chess object are available
    if (!gameLogicRef.current || !gameLogicRef.current.chess) return;
  
    // Check whose turn it is
    const isBlackTurn = gameLogicRef.current.chess.turn() === 'b';
  
    // Only update recent moves when it's White's turn (after Black has moved)
    if (!isBlackTurn) {
      const moves = gameLogicRef.current.getRecentMoves();
      setRecentMoves(moves);
    }
  }, [boardState]);
 
  useEffect(() => {
    const captured = gameLogicRef.current.getCapturedMaterial();
    setCapturedMaterial(captured);
  }, [/* Add dependencies like current FEN or moves */]);

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
          padding: 0,
          fontSize: 18,
          color: '#aec4e8',
          textAlign: 'center',
          fontSize: 20,
          borderRightWidth: 1,
          borderColor: 'white',
        },
        adviceColumn: {
           //width: '70%',
          flex: 1.4,
        },
        responseColumn: {
           //width: '30%',
          flex: 2.75,
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
          paddingHorizontal: 0,
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
          position: 'absolute',
          bottom: '5%', // Move the spinner upward to approximately the correct spot
          //top: 20,
          alignSelf: 'center', // Center horizontally
          transform: [{ translateY: -10 }], // Optional: fine-tune vertical positioning
          marginTop: 10, // Space below Game Analysis
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
        capturedContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 5,
          width: '85%',
          marginLeft: 35,
            
        
        },
        capturedSide: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        capturedPiece: {
          width: 20, // Smaller size for captured pieces
          height: 20,
          marginHorizontal: 2,
        },
        glowEffect: {
          shadowColor: '#FFFFFF', // Black glow for white pieces, white glow for black pieces
          shadowOpacity: 1,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 0 },
          elevation: 5, // Android equivalent of shadow
        },
        disabledText: {
          color: 'gray', // Dim text color for disabled state
          textDecorationLine: 'line-through', // Optional: Add a visual cue
        },
        recentMovesContainer: {
          alignItems: 'center', 
          marginVertical: 10,
        },
        recentMovesText: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#ffffff',
        },
      }),
    [windowWidth]
  );

  const openSystemSubscriptionPage = () => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
      Linking.openURL(url).catch((err) =>
        console.error('Failed to open subscription management:', err)
      );
  };

  const handleInAppSubscription = async (plan) => {
    const subscribed = await subscribeToAI(plan); // 'monthly', 'yearly', etc.
    if (subscribed) {
      console.log('Subscription activated');
    } else {
      console.log('Subscription failed');
    }
  };



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

  const handleBackPress = () => {
    if (currentAdviceIndex >= 0) { 
      const newIndex = currentAdviceIndex - 1;
      if (newIndex >= 0) {
        const updatedHistory = adviceHistory.map((entry, index) => ({
          ...entry,
          isCurrentlyDisplayed: index === newIndex
        }));
        setAdviceHistory(updatedHistory);
        setCurrentAdviceIndex(newIndex);
        gameLogicRef.current.loadFen(updatedHistory[newIndex].fen);
        setBoardState(gameLogicRef.current.getBoardState());
        updateCapturedMaterial();
        const advice = updatedHistory[newIndex];
        if (advice) {
          const processedAdvice = renderAdvisedMoves(advice.advisedMoves);
          setRecommendedNextMoves(processedAdvice);
          setPositionAnalysis(advice.positionAnalysis);
          setDisplayedArrows(processedAdvice.map(move => ({
            from: move.from,
            to: move.to,
            arrowSize: move.arrowSize,
          })));
          //setPositionAnalysis('Game analysis based on table data.');
        }
      }
    }
  };
  
  const handleForwardPress = () => {
    console.log('forward');
    if (currentAdviceIndex < adviceHistory.length - 1) {
      // console.log('Advice History FENs:', adviceHistory.map(e => e.fen));
      console.log('isCurrentlyDisplayed states:', adviceHistory.map(e => e.isCurrentlyDisplayed));
      console.log(currentAdviceIndex);
      const newIndex = currentAdviceIndex + 1;
      const updatedHistory = adviceHistory.map((entry, index) => ({
        ...entry,
        isCurrentlyDisplayed: index === newIndex
      }));
      setAdviceHistory(updatedHistory);
      setCurrentAdviceIndex(newIndex);
      gameLogicRef.current.loadFen(updatedHistory[newIndex].fen);
      setBoardState(gameLogicRef.current.getBoardState());
      updateCapturedMaterial();
      const advice = updatedHistory[newIndex];
      if (advice) {
        const processedAdvice = renderAdvisedMoves(advice.advisedMoves);
        setRecommendedNextMoves(processedAdvice);
        setPositionAnalysis(advice.positionAnalysis);
        setDisplayedArrows(processedAdvice.map(move => ({
          from: move.from,
          to: move.to,
          arrowSize: move.arrowSize,
        })));
        setPositionAnalysis('Game analysis based on table data.');
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
    setCapturedMaterial({
      white: {}, // Empty object for white pieces
      black: {}, // Empty object for black pieces
    });
    setPossibleMoves([]);
    textOpacity.setValue(1);
    thinkingMovesOpacity.setValue(0);
    thinkingAnalysisOpacity.setValue(0);
    setIsThinkingMoves(false);
    setIsThinkingAnalysis(false);
    analysisComplete.current = false;
    setCurrentMoveIndex(0);
    setAdviceHistory([]);
    setCurrentAdvice(null);
    setIsWhiteTurn(true);
  };

  const onSquarePress = (position) => {
    if (isThinkingMoves) {
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
        const playerMove = gameLogicRef.current.makeMove_White({ from: fromSquare, to: toSquare });
        if (!playerMove) {
            setIllegalMoveSquares({ from: fromSquare, to: toSquare });
            return;
        }
        setBoardState([...gameLogicRef.current.getBoardState()]);
        setDisplayedArrows([]);
        setPositionAnalysis('');
        const playerFen = gameLogicRef.current.getFen();
        updateCapturedMaterial();
        const truncatedAdviceHistory = adviceHistory.slice(0, Math.floor(currentMoveIndex / 2));
        setCurrentMoveIndex(currentMoveIndex + 1);
        if (gameLogicRef.current.chess.isCheckmate()) {
            Alert.alert('Game Over', 'Checkmate! The game has ended.', [{ text: 'OK', onPress: () => handleReload() }]);
            return;
        } 
        setIsThinkingMoves(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const blackMoveResult = gameLogicRef.current.makeMove_Black(playerMove.san);
        setBoardState([...gameLogicRef.current.getBoardState()]);
        const engineFen = gameLogicRef.current.getFen();
        setCurrentMoveIndex(currentMoveIndex + 2);
        updateCapturedMaterial();
        fetchMovesAfterBlackMove();       
        setIsThinkingMoves(false);

        if (hasAIFeature) {
          setIsThinkingAnalysis(true);
          await fetchReasoningAfterBlackMove();
          setIsThinkingAnalysis(false);
        } else {
          setPositionAnalysis('Subscribe to unlock AI-powered analysis.');
        }

    } catch (error) {
        console.log('Error during move:', error);
        Alert.alert('Error', 'Error processing move, please try again.', [{ text: 'OK' }]);
        setIllegalMoveSquares({ from: fromSquare, to: toSquare });
    }
  };

  const fetchMovesAfterBlackMove = () => {
    const adviceEntry = gameLogicRef.current.getTableData();
    gameLogicRef.current.latestAdvice=adviceEntry; 
    if (!adviceEntry || adviceEntry.length === 0) {
      console.log('Error: Table data is empty or undefined.');
      setPositionAnalysis('');
      setRecommendedNextMoves([]);
      setDisplayedArrows([]);
      analysisComplete.current = false;
      return;
    }
    const moveNumber = adviceEntry.moveIndex;
    const updatedAdviceHistory = [
      ...adviceHistory.slice(0, moveNumber).map(entry => ({
        ...entry,
        isCurrentlyDisplayed: false
      })),
      {
        ...adviceEntry,
        reasoning: adviceEntry.reasoning || [],
        positionAnalysis: adviceEntry.positionAnalysis || '',
        fen: gameLogicRef.current.getFen(),
        isCurrentlyDisplayed: true,
      }
    ];
    setAdviceHistory(updatedAdviceHistory);
    setCurrentAdvice(adviceEntry);
    setCurrentAdviceIndex(moveNumber);
    const processedAdvice = renderAdvisedMoves(adviceEntry.advisedMoves);
    setRecommendedNextMoves(processedAdvice);
    setDisplayedArrows(processedAdvice.map(move => ({
      from: move.from,
      to: move.to,
      arrowSize: move.arrowSize,
    })));
    //setPositionAnalysis('Game analysis based on table data.');
    analysisComplete.current = true;
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const fetchReasoningAfterBlackMove = async () => {
    try {
      setIsPopupLoading(true); // Show spinner in popup
      const apiName = 'Claude';

      // const adviceEntry = gameLogicRef.current.getTableData();
      // gameLogicRef.current.latestAdvice=adviceEntry; 
      const advisedMoves = gameLogicRef.current.latestAdvice?.advisedMoves || [];
      //const advisedMoves = gameLogicRef.current.getTableData();
      //  const advisedMoves = gameLogicRef.current.latestAdvice;
console.log('fetchReasoningAfterBlackMove.advisedMoves ',advisedMoves);

      if (!advisedMoves) {
        console.log('No advised moves available for reasoning.');
        setIsPopupLoading(false); // Ensure spinner stops if no advice
        return;
      }
      const reasoningData =  await gameLogicRef.current.getReasoningFromAI(apiName, advisedMoves);
      setPopupDescription(reasoningData.positionAnalysis || 'Reasoning returned.');
      setIsPopupLoading(false);
      const updatedAdvice = advisedMoves.map((move, index) => ({
        ...move,
        reasoning: reasoningData.reasoning[index] || move.reasoning,
      }));
      const adviceEntry = {
        ...gameLogicRef.current.latestAdvice,
        advisedMoves: updatedAdvice,
        positionAnalysis: reasoningData.positionAnalysis,
      };
      gameLogicRef.current.latestAdvice = adviceEntry;
      setAdviceHistory(prev => {
        const updated = [...prev];
        updated[adviceEntry.moveIndex] = {
          ...adviceEntry,
          isCurrentlyDisplayed: true,
        };
        return updated;
      });
      setCurrentAdvice(adviceEntry);
      // Re-process advice
      const processedAdvice = renderAdvisedMoves(updatedAdvice);
      setRecommendedNextMoves(processedAdvice);
      setPositionAnalysis(reasoningData.positionAnalysis);
      analysisComplete.current = true;
      setIsPopupLoading(false); // Hide spinner
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
  
  function renderAdvisedMoves(advisedMoves) {
    return advisedMoves.map((move, index) => {
      let label = '(STRONG)';
      if (advisedMoves.length === 1) {
        label = '(STRONGEST)';
      } else if (advisedMoves.length === 2) {
        label = index === 0 ? '(STRONGER)' : '(STRONG)';
      } else if (advisedMoves.length >= 3) {
        if (index === 0) label = '(STRONGEST)';
        else if (index === 1) label = '(STRONGER)';
      }
      const fromSquare = move.move.slice(0, 2);
      const toSquare = move.move.slice(2, 4);
      let arrowSize;
      switch (label) {
        case '(STRONGEST)':
          arrowSize = 7; 
          break;
        case '(STRONGER)':
          arrowSize = 5; 
          break;
        default:
          arrowSize = 3;
      }
  
      return {
        ...move,
        move: `${move.san} ${label}`,
        from: fromSquare,
        to: toSquare,
        arrowSize: arrowSize,
      };
    });
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

  }

  const updateCapturedMaterial = () => {
    const captured = gameLogicRef.current.getCapturedMaterial();
    setCapturedMaterial(captured);
  };

  
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
        disableBack={currentAdviceIndex < 0}  // Disable only when we're at the start
        disableForward={currentAdviceIndex >= adviceHistory.length - 1}  // Disable only when we're at the end
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
    <View style={styles.recentMovesContainer}>
        <Text style={styles.recentMovesText}>
          {recentMoves.join('\n')}
        </Text>
          </View> 
          <View style={styles.chessboardContainer}>
            <ChessBoard2D
              boardSize={chessboardSize}
              boardState={boardState}
              onSquarePress={onSquarePress}
              selectedSquare={selectedSquare}
              illegalMoveSquares={illegalMoveSquares}
              advisedMove={analysisComplete.current ? advisedMove : null}
              possibleMoves={possibleMoves}
              isThinkingMoves={isThinkingMoves}
              recommendedMoves={displayedArrows}
            />
          </View>
          <View style={[styles.capturedContainer, styles.glowEffect]}>
            <View style={styles.capturedSide}>
              {Object.entries(capturedMaterial.black).map(([piece, count]) =>
                [...Array(count)].map((_, index) => (
                  <Image
                    key={`black-${piece}-${index}`}
                    source={pieceAssets[piece]}
                    style={styles.capturedPiece}
                  />
                ))
              )}
            </View>

            <View style={styles.capturedSide}>
              {Object.entries(capturedMaterial.white).map(([piece, count]) =>
                [...Array(count)].map((_, index) => (
                  <Image
                    key={`white-${piece}-${index}`}
                    source={pieceAssets[piece]}
                    style={styles.capturedPiece}
                  />
                ))
              )}
            </View>
          </View>
          {/* Analysis texts */}
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.textContainer}>
            <Animated.View style={[styles.analysisContainer, { opacity: textOpacity }]}>
              {Array.isArray(recommendedNextMoves) && recommendedNextMoves.length > 0 ? (
                <View>
                  <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableHeader]}>Advice</Text>
                      <Text style={[styles.tableCell, styles.tableHeader]}>Likely Responses</Text>
                    </View>
                    {recommendedNextMoves.map((move, index) => (
                      <View key={index} style={styles.tableRow}>
                        <View style={[styles.tableCell, styles.adviceColumn]}>
                          <TouchableOpacity disabled={isPopupLoading}  onPress={() => handleMovePress(move.san, 'w', move.reasoning)}>
                            <Text style={[styles.tappableMove, isPopupLoading && styles.disabledText]}>{move.move}</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.tableCell, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                          {move.likelyResponses.map((response, idx) => (
                            <TouchableOpacity
                              key={idx}
                              onPress={() =>
                                handleMovePress(response.san, 'b', response.threat, move.originalMove)
                              }
                            >
                              <Text style={styles.tappableMove}>{response.san}</Text>
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
                {hasAIFeature ? (
                  positionAnalysis ? (
                      <View>
                        <Text style={styles.analysisTitle}>Game Analysis:</Text>
                        <Text style={styles.analysisText}>{positionAnalysis}</Text>
                      </View>
                    ) : (
                      <Text style={styles.noDataText}></Text>
                    )
                ) : (
                  <View>
                    <Text style={styles.noDataText}>
                      Subscribe to unlock AI-powered analysis and reasoning!
                    </Text>
                    <TouchableOpacity onPress={openSystemSubscriptionPage}>
                      <Text style={styles.subscribeButton}>Subscribe Now</Text>
                    </TouchableOpacity>
                  </View>
                )}
            </Animated.View>
          </ScrollView>

  
        {isThinkingAnalysis && (
          <View style={styles.bottomSpinnerContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}
        </View>
      </View>
      <SANPopup
        visible={popupVisible}
        description={popupDescription}
        onClose={() => setPopupVisible(false)}
        isLoading = {isPopupLoading}
        hasAIFeature = {hasAIFeature}
        openSystemSubscriptionPage = {openSystemSubscriptionPage}
      />
    </SafeAreaView>
  );
  
  
};

export default ChessTutorApp;
