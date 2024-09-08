import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import ChessBoard2D from './components/ChessBoard2D';
import GameLogic from './GameLogic';

const App = () => {
  const gameLogicRef = useRef(new GameLogic());
  const [boardState, setBoardState] = useState(gameLogicRef.current.getBoardState());
  const [aiMove, setAIMove] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [topText, setTopText] = useState('Waiting on player');
  const [bottomText, setBottomText] = useState('Make your move!');
  
  const onMove = async (fromSquare, toSquare) => {
    const moveResult = gameLogicRef.current.makeMove(fromSquare, toSquare);
    
    if (moveResult) {
      setBoardState(gameLogicRef.current.getBoardState());
      setTopText('Analyzing AI move...');

      const aiResult = await gameLogicRef.current.makeAIMove();
      if (aiResult) {
        setBoardState(aiResult.boardState);
        setAIMove(aiResult.move);
        setTopText(`Computer moved: ${aiResult.move}`);
        setBottomText(`Analysis: ${aiResult.explanation}`);
        
        const playerAdvice = await gameLogicRef.current.getPlayerMoveAdvice();
        if (playerAdvice) {
          setBottomText(`Advice for you: ${playerAdvice}`);
        }
      }
    } else {
      setTopText('Invalid move, try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.topText}>{topText}</Text>
      <ChessBoard2D boardState={boardState} onMove={onMove} />
      <Text style={styles.bottomText}>{bottomText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  topText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'blue',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
    color: 'green',
    textAlign: 'center',
  },
});

export default App;
