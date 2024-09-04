// import React, { useState, useEffect } from 'react';
// import ChessBoard from '../components/ChessBoard';

// import {
//   ViroARScene,
//   ViroText,
//   ViroConstants,
//   Viro3DObject,
//   ViroAmbientLight,
//   ViroBox,
//   ViroNode,
//   ViroMaterials,
// } from 'react-viro';
// import { Chess } from 'chess.js';

// const ARChessScene = () => {
//   const [initializing, setInitializing] = useState(true);
//   const [chess] = useState(new Chess());
//   const [selectedPiece, setSelectedPiece] = useState(null);
//   const [boardState, setBoardState] = useState(chess.board());
//   const [skillLevel, setSkillLevel] = useState('beginner');

//   useEffect(() => {
//     // This effect runs when the boardState is updated
//     setBoardState(chess.board());
//   }, [chess]);

//   const onInitialized = (state, reason) => {
//     if (state === ViroConstants.TRACKING_NORMAL) {
//       setInitializing(false);
//     }
//   };

//   const handlePieceSelection = (row, col) => {
//     const square = indexToSquare(row, col);
//     if (selectedPiece) {
//       const move = chess.move({ from: selectedPiece, to: square });
//       if (move) {
//         setBoardState(chess.board());
//         setSelectedPiece(null);
//         provideFeedback(move);
//         makeAIMove();
//       } else {
//         alert('Invalid move. Please try again.');
//       }
//     } else {
//       setSelectedPiece(square);
//     }
//   };

//   const provideFeedback = (move) => {
//     const feedback = analyzeMove(move);
//     // Display feedback in AR or console for now
//     console.log(feedback);
//   };

//   const makeAIMove = () => {
//     const possibleMoves = chess.moves();
//     if (possibleMoves.length === 0) {
//       if (chess.in_checkmate()) {
//         alert('Checkmate! You win!');
//       } else if (chess.in_stalemate()) {
//         alert('Stalemate!');
//       }
//       return;
//     }

//     const aiMove = selectBestMove();
//     chess.move(aiMove);
//     setBoardState(chess.board());
//     provideAIFeedback(aiMove);
//   };

//   const selectBestMove = () => {
//     const possibleMoves = chess.moves();
//     const randomIndex = Math.floor(Math.random() * possibleMoves.length);
//     return possibleMoves[randomIndex];
//   };

//   const provideAIFeedback = (move) => {
//     const feedback = `AI moved ${move.from} to ${move.to}`;
//     // Display feedback in AR or console for now
//     console.log(feedback);
//   };

//   const analyzeMove = (move) => {
//     if (skillLevel === 'beginner') {
//       return basicAnalysis(move);
//     } else if (skillLevel === 'intermediate') {
//       return intermediateAnalysis(move);
//     } else {
//       return advancedAnalysis(move);
//     }
//   };

//   const basicAnalysis = (move) => {
//     return move.captured
//       ? 'Good move! You captured an opponent piece.'
//       : 'Try to control the center squares for a stronger position.';
//   };

//   const intermediateAnalysis = (move) => {
//     return 'Great move! Now consider your next steps to keep the advantage.';
//   };

//   const advancedAnalysis = (move) => {
//     return 'Advanced move detected! Keep up the pressure.';
//   };

//   const indexToSquare = (row, col) => {
//     const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
//     return files[col] + (8 - row);
//   };

//   return (
//     <ViroARScene onTrackingUpdated={onInitialized}>
//       <ViroAmbientLight color="#FFFFFF" intensity={500} />
//       {!initializing && (
//         <ViroNode position={[0, -1, -3]}>
//           <ViroBox
//             position={[0, 0, 0]}
//             scale={[1, 0.1, 1]}
//             materials={['chessboard']}
//           />
//           <ChessBoard boardState={boardState} onPieceSelect={handlePieceSelection} />
//         </ViroNode>
//       )}
//     </ViroARScene>
//   );
// };

// const getPieceModel = (piece) => {
//   // Return the 3D model source based on the piece type and color
//   // Example:
//   // return piece.color === 'w' 
//   //   ? require('./assets/pieces/white_pawn.obj') 
//   //   : require('./assets/pieces/black_pawn.obj');
// };

// ViroMaterials.createMaterials({
//   chessboard: {
//     diffuseColor: '#8B4513', // Using a brown color as a placeholder
//   },
//   white_piece: {
//     diffuseColor: '#FFFFFF', // Using white color
//   },
//   black_piece: {
//     diffuseColor: '#000000', // Using black color
//   },
// });


// export default ARChessScene;
