import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import ChessBoard from './components/ChessBoard';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [aiMove, setAIMove] = useState('');
  const [playerMove, setPlayerMove] = useState('');
  const [topText, setTopText] = useState('Waiting on player'); // Initial state for top text
  const [bottomText, setBottomText] = useState('Make your move!'); // Initial state for bottom text
  const [isFirstMove, setIsFirstMove] = useState(true); // To track if it’s the player’s first move

  const onMove = (fromSquare, toSquare) => {
    const moveResult = gameLogicRef.current.makeMove(fromSquare, toSquare);
    if (moveResult) {
      setBoardState(gameLogicRef.current.getBoardState());

      // Bottom text: Player's move, followed by AI advice placeholder
      setBottomText(`Player moved from ${fromSquare} to ${toSquare}\nAI move advice will go here eventually`);

      setTopText('Waiting...'); // Set top text to 'Waiting' while AI is thinking

      setTimeout(() => {
        const aiResult = gameLogicRef.current.makeAIMove();
        if (aiResult) {
          setBoardState(aiResult.boardState);
          setAIMove(aiResult.move.san);

          // After the AI move, show the AI's move and set appropriate top text
          if (isFirstMove) {
            setTopText(`Computer moved: ${aiResult.move.san}\nAnalysis of computer's move will go here eventually.\nWaiting on player's move.`);
            setIsFirstMove(false); // Now it's no longer the first move
          } else {
            setTopText(`Computer moved: ${aiResult.move.san}\nAnalysis of computer's move will go here eventually.\nWaiting on player's move.`);
          }
        }
      }, 500);
      return moveResult;
    }
    return null;
  };

  useEffect(() => {
    console.log("Current board state:", boardState);
  }, [boardState]);

  return (
    <View style={styles.container}>
      {/* Top Text - Computer's move */}
      <Text style={styles.topText}>{topText}</Text>

      {/* Chess Board */}
      <ChessBoard
        boardState={boardState}
        onMove={onMove}
      />

      {/* Bottom Text - Player's move */}
      <Text style={styles.bottomText}>{bottomText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10, // Added padding for aesthetics
  },
  topText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'blue',
    textAlign: 'center', // Center-align the text for better presentation
    lineHeight: 24, // Line height for better spacing between lines
  },
  bottomText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: 'green',
    textAlign: 'center', // Center-align the text for better presentation
    lineHeight: 24, // Line height for better spacing between lines
  },
});

export default App;
