import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import stockfish from 'stockfish.wasm'; // Import Stockfish

const StockfishTest = () => {
  useEffect(() => {
    const engine = stockfish();

    engine.onmessage = (event) => {
      console.log("Stockfish: ", event); // Log Stockfish output
    };

    engine.postMessage('uci');
    engine.postMessage('isready');
    engine.postMessage('position startpos');
    engine.postMessage('go depth 10');

  }, []);

  return (
    <View>
      <Text>Stockfish Test</Text>
    </View>
  );
};

export default StockfishTest;
