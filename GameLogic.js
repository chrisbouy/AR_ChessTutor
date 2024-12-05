import { Chess } from 'chess.js';
import { validateFen } from "chess.js";
import { ToastAndroid } from 'react-native';
const { Engine } = require('./engines/wukong');


class GameLogic {
    constructor() {
      this.chess = new Chess();   
      this.latestAdvice = null; 
      this.engine = null; // Initialize the engine 
    }
    initializeEngine() {
      try {
        this.engine = new Engine();
        // console.log('Engine initialized successfully:', this.engine);
    } catch (error) {
        console.error('Failed to initialize the engine:', error);
    } 
    }
    getBoardState() {
        const board = this.chess.board();
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        return board.map((row, rowIndex) => {
            return row.map((piece, colIndex) => {
                const position = files[colIndex] + (8 - rowIndex);
                const squareColor = (rowIndex + colIndex) % 2 === 0 ? '#c0dae6' : '#1594da';
                return {
                    position,
                    color: squareColor,
                    piece: piece ? { type: piece.type, color: piece.color } : null,
                };
            });
        });
    }
    makeMove_White(move) {
        try {
          if (!this.engine) {
            console.error('Engine is not initialized');
            return null;
        }
            const result = this.chess.move(move);

            // let promotedPiece = (this.engine.getSide() ? (5 + 6): 5) // queen promotion only for now
            //  let encodedmove = move.from + move.to + this.engine.promotedToString(promotedPiece);
            //  console.log('encodedmove ',encodedmove);
            //  let validMove = this.engine.moveFromString(encodedmove);
            //  console.log('validMove ', validMove);

             this.engine.makeMove(this.encodeMove(move));
            // const fen = this.engine.generateFen(); // Get the updated FEN
            //  console.log('move:', move);
            this.engine.printBoard();

            // this.engine.setFEN(this.chess.fen());
            // console.log(`fen in logic.makemovewhite after move:  ${this.chess.fen()}`);

            if (result) {
                // this.engine.setFEN(this.chess.fen());
                // console.log(`White move made: ${result.san}`);
                // console.log('New FEN after white:', this.chess.fen());
                // console.log('Side to move:', this.chess.turn() === 'w' ? 'White' : 'Black');
    
            }
            return result;
        } catch (error) {
            console.error('Error making move:', error);
            return null;
        }
    }
    getPieceAt(position) {
        const rowIndex = 8 - parseInt(position[1]);
        const colIndex = position.charCodeAt(0) - 'a'.charCodeAt(0);
        const piece = this.chess.board()[rowIndex][colIndex];
        return piece ? { type: piece.type, color: piece.color } : null;
    }
    getLegalMoves(position) {
        // console.log('Current FEN:', this.chess.fen());

        // console.log('Legal Moves for position', position, ':', this.chess.moves({ square: position }));

        return this.chess.moves({ square: position, verbose: true });
    }
    encodeMove(move)
    {
      let promotedPiece = (this.engine.getSide() ? (5 + 6): 5) // queen promotion only for now
      let encodedmove = move.from + move.to + this.engine.promotedToString(promotedPiece);
      console.log('encodedmove ',encodedmove);
      let validMove = this.engine.moveFromString(encodedmove);
      console.log('validMove ', validMove);
      return validMove;
    }
    makeMove_Black(whiteMove) {
        const originalFEN = this.chess.fen();

        // Check if White's move is one of the advised moves
        const advisedMove = this.latestAdvice?.find(advice => advice.san === whiteMove);
        // console.log(`latestadvice: ${JSON.stringify(this.latestAdvice,null,2)}`);        
       
        // console.log(`white move: ${JSON.stringify(whiteMove,null,2)}`);        
        // console.log(`advised move: ${JSON.stringify(advisedMove,null,2)}`);
        if (advisedMove) {
            // White's move matches advice; pick one of the likely responses
            const blackResponses = advisedMove.likelyResponses;
            const selectedMove = blackResponses[Math.floor(Math.random() * blackResponses.length)];
            // console.log(`fen in logic.makemoveblack before script move: ${this.chess.fen()}`);

            const result=this.chess.move(selectedMove.move); // Make Black's response
            // this.engine.setFEN(this.chess.fen());
            this.engine.makeMove(selectedMove.move);
            // console.log(`Black move made: ${result.san}`);
            // console.log(`fen in logic.makemoveblack after script move: ${this.chess.fen()}`);

            return {
                move: selectedMove.move,
                boardState: this.getBoardState(),
                status: this.getGameStatus(),
            };
        } else {
            console.log(`White's move does not match advice; calculate the best move dynamically`);
            // const bestMove = this.engine.searchPosition(3)[0];
            // 
            // let bestMove = this.engine.searchTime(1000); 
            //  console.log('result from searchTime:', JSON.stringify(bestMove, null, 2));
            // const fromAlgebraic = this.indexToAlgebraic(bestMove.move.from);
            // const toAlgebraic = this.indexToAlgebraic(bestMove.move.to);
            // console.log(`Converting from ${bestMove.move.from} to ${fromAlgebraic}`);
            // console.log(`Converting to ${bestMove.move.to} to ${toAlgebraic}`);
            // const result=this.chess.move({ from: fromAlgebraic, to: toAlgebraic });
            // this.engine.setFEN(this.chess.fen());

            // this.engine.setBoard(this.engine.generateFen());
            // console.log('Engine state before making move:');
// this.engine.printBoard();
             let bestMove = this.engine.searchTime(1000); // search for 1 second
            console.log('bestmove ', bestMove);
             this.engine.makeMove(bestMove);
            // let fen = engine.generateFen();
            // board.position(fen);
             this.engine.printBoard();




            // console.log(`off-script Black move made: ${result.san}`);
            // console.log(`fen in logic.makemoveblack after off-script move:  ${this.chess.fen()}`);
            // console.log(`black moves: ${bestMove.move.san}`);
            // console.log(`new fen in makeblackmove: ${this.chess.fen()}`);            
            return {
                move: bestMove.move,
                boardState: this.getBoardState(),
                status: this.getGameStatus(),
            };
        }
    }
    indexToAlgebraic(index) {
        const file = index & 7;
        const rank = (index >> 4) + 1;
        if (file < 0 || file > 7 || rank < 1 || rank > 8) {
            console.log(`Invalid index for algebraic conversion: ${index}`);
            return null;
        }
        return 'abcdefgh'[file] + rank;
    }
    makePrincipledMove(legalMoves) {
        // Score moves based on basic chess principles
        const scoredMoves = legalMoves.map(move => {
            let score = 0;
            
            // Early game principles
            if (this.chess.moveNumber() <= 10) {
                // Develop knights to good squares
                if (move.piece === 'n') {
                    if (['c6', 'f6'].includes(move.to)) score += 100;  // Best knight squares
                    if (['e7', 'd6'].includes(move.to)) score += 50;   // OK knight squares
                    if (move.to.includes('a') || move.to.includes('h')) score -= 100; // Knights on rim
                }
                
                // Control center with pawns
                if (move.piece === 'p') {
                    if (['d5', 'e5'].includes(move.to)) score += 90;
                    if (['c5', 'f5'].includes(move.to)) score += 40;
                }
                
                // Develop bishops
                if (move.piece === 'b') {
                    if (['f5', 'g4', 'c5', 'd6'].includes(move.to)) score += 80;
                }
                
                // Penalize early queen moves
                if (move.piece === 'q') score -= 150;
            }
            
            // General principles
            if (move.captured) {
                const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
                score += pieceValues[move.captured] * 50;
                
                // Don't trade unless capturing higher value piece
                if (pieceValues[move.piece] > pieceValues[move.captured]) {
                    score -= 30;
                }
            }
            
            return { move, score };
        });
            // Sort by score and get best move
        scoredMoves.sort((a, b) => b.score - a.score);
        const bestMove = scoredMoves[0].move;
        
        // Make the move
        const result = this.chess.move(bestMove);
        // this.engine.setFEN(this.chess.fen());
        this.engine.makeMove(bestMove);
        // console.log(`fen in logic.makeprincipalmove after  move: ${this.chess.fen()}`);

        return {
            move: result,
            boardState: this.getBoardState(),
            status: this.getGameStatus()
        };
    }
    findSafestMove(moves) {
        // Conservative move selection when main engine fails
        const scoredMoves = moves.map(move => {
            let score = 0;
            
            // Prefer developing moves in opening
            if (this.chess.moveNumber() < 10) {
                // Develop knights to good squares
                if (move.piece === 'n' && ['c6', 'f6'].includes(move.to)) {
                    score += 50;
                }
                
                // Develop center pawns
                if (move.piece === 'p' && ['d5', 'e5'].includes(move.to)) {
                    score += 40;
                }
                
                // Penalize early queen moves
                if (move.piece === 'q') {
                    score -= 100;
                }
            }
            
            // Avoid moving to edge of board
            if (move.to.includes('a') || move.to.includes('h')) {
                score -= 30;
            }
            
            // Avoid moving same piece twice in opening
            const history = this.chess.history({ verbose: true });
            if (this.chess.moveNumber() < 10 && 
                history.some(h => h.piece === move.piece && h.from === move.from)) {
                score -= 40;
            }
            
            return { move, score };
        });
        
        // Sort by score and return the best conservative move
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0].move;
    }
    selectRandomMove() {
        const moves = this.chess.moves();
        if (moves.length === 0) return null;
        return moves[Math.floor(Math.random() * moves.length)];
    }
    getGameStatus() {
        if (this.chess.isCheckmate()) return 'checkmate';
        if (this.chess.isDraw()) return 'draw';
        return 'ongoing';
    }
    getTableData() {
        const originalFEN = this.chess.fen();
        // this.engine.setFEN(this.chess.fen());
        // Step 1: Get top 3 moves for White
        const topWhiteMoves = [
            this.engine.searchTime(1500),
            this.engine.searchTime(1000),
            this.engine.searchTime(500)
        ];
        // console.log(`white move 1: ${JSON.stringify(topWhiteMoves[0],null,2)}`);
        // console.log(`white move 2: ${JSON.stringify(topWhiteMoves[1],null,2)}`);
        // console.log(`white move 3: ${JSON.stringify(topWhiteMoves[2],null,2)}`);
        // Step 2: For each move, get likely Black responses
        const tableData = topWhiteMoves.map((whiteMove) => {
            //  console.log(`fen in logic.gettabledata before temp move:        ${this.chess.fen()}`);
            const fromAlgebraic = this.indexToAlgebraic(whiteMove.move.from);
            const toAlgebraic = this.indexToAlgebraic(whiteMove.move.to);
            const moveResult = this.chess.move({ from: fromAlgebraic, to: toAlgebraic });
            //  console.log(`fen in logic.gettabledata after temp move:        ${this.chess.fen()}`);
            
            const fenafterwhite = this.chess.fen()
            this.engine.makeMove(whiteMove.move);
            // this.engine.setFEN(fenafterwhite);
            // console.log('temp white');
            // this.engine.printBoard();
            // console.log(this.chess.ascii());

            if (!moveResult) {
               console.warn(`Failed to make temporary White move: `);
              return null;
            }
            const sanMove = moveResult.san;
            const likelyResponses = [
                this.engine.searchTime(1000),
                this.engine.searchTime(500)
            ];
            // console.log(`likelyResponses:`);
            const processedResponses = likelyResponses.map((response) => {
                const responseFrom = this.indexToAlgebraic(response.move.from);
                const responseTo = this.indexToAlgebraic(response.move.to);
                // Get SAN notation for the response
                const responseResult = this.chess.move({ from: responseFrom, to: responseTo });
                const responseSan = responseResult ? responseResult.san : '';
                this.chess.undo();  //undo black response
                // this.engine.setFEN(fenafterwhite);
                this.engine.takeBack();
                // console.log(`from ${responseFrom}`);
                // console.log(`to ${responseTo}`);
                return {
                    san: responseSan,
                    move:response.move,
                };
            });
            //this.chess.undo();  //undo white advice
            this.chess.load(originalFEN); // Restore FEN
            // this.engine.setFEN(originalFEN);
            this.engine.takeBack();
            //  console.log(`move: ${whiteMove.move.san}`);
            return {
                san: sanMove,
                move: whiteMove.move,
                // reasoning: this.attachAttributes(whiteMove),
                likelyResponses: processedResponses
            };
        });
        return tableData.filter(row => row !== null);;
    }
    // attachAttributes(moveInfo) {
    //     const reasoning = [];
    //     if (moveInfo.move.captured) {
    //         reasoning.push(`Captures opponent's ${this.engine.getPieceName(moveInfo.move.captured)}`);
    //     }
    //     // if (this.engine.CENTER_SQUARES.includes(moveInfo.move.to)) {
    //     //     reasoning.push('Controls a central square');
    //     // }
    //     if (moveInfo.score > 100) {
    //         reasoning.push('Significant positional advantage');
    //     }
    //     return reasoning.join(', ');
    // }
    // convertMoveToDescription(sanMove, color) {
    //     const originalFEN = this.chess.fen();
    //     const tempChess = new Chess(originalFEN);

    //     // Set the correct side to move if needed
    //     if (color === 'b') {
    //         const fenParts = originalFEN.split(' ');
    //         fenParts[1] = 'b';
    //         tempChess.load(fenParts.join(' '));
    //     }

    //     const moves = tempChess.moves({ verbose: true });
    //     const move = moves.find(m => m.san === sanMove);

    //     if (!move) return sanMove;

    //     if (move.flags.includes('k') || move.flags.includes('q')) {
    //         const side = move.san === 'O-O' ? 'king-side' : 'queen-side';
    //         return `Castling ${side} from ${move.from.toUpperCase()} to ${move.to.toUpperCase()}`;
    //     }

    //     const pieceName = this.getPieceName(move.piece);
    //     const action = move.captured ? 'captures on' : 'to';
    //     const promotion = move.promotion ? ` and promotes to ${this.getPieceName(move.promotion)}` : '';
        
    //     return `${pieceName} from ${move.from.toUpperCase()} ${action} ${move.to.toUpperCase()}${promotion}`;
    // }
    // getPieceName(pieceSymbol) {
    //     const pieceNames = {
    //         p: 'Pawn',
    //         n: 'Knight',
    //         b: 'Bishop',
    //         r: 'Rook',
    //         q: 'Queen',
    //         k: 'King'
    //     };
    //     return pieceNames[pieceSymbol.toLowerCase()] || 'Piece';
    // }

  async storeApiKey(key) {
    try {
      await EncryptedStorage.setItem('apiKey', key);
      this.apiKey = key; // Optionally update the instance variable
      // console.log('API key stored successfully.');
    } catch (error) {
      console.error('Error storing the API key:', error);
    }
  }
  async retrieveApiKey() {
    try {
      const key = await EncryptedStorage.getItem('apiKey');
      if (key) {
        this.apiKey = key; // Store it in the instance variable
        // console.log('API key retrieved:', key); // Be cautious with logging sensitive data
        return key;
      } else {
        console.error('API key not found in storage.');
        return null;
      }
    } catch (error) {
      console.error('Error retrieving the API key:', error);
      return null;
    }
  }
  async removeApiKey() {
    try {
      await EncryptedStorage.removeItem('apiKey');
      this.apiKey = null; // Optionally clear the instance variable
    } catch (error) {
      console.error('Error removing the API key:', error);
    }
  }
  async getDataFromGPT(system_prompt, user_prompt) {
    try {
      // Log the request headers (mask the API key)
    //   console.log('Request Headers:', {
    //     'Content-Type': 'application/json',
    //     'Authorization': '***MASKED_API_KEY***' // Masked for security
    //   });
  
    //   // Log the request body
      // console.log('Request Body:', {
    //       model: "gpt-4o-mini",
    //       messages: [
    //         {
    //           role: 'system',
               console.log('gpt system_prompt ',system_prompt);
    //         },
    //         {
    //           role: 'user',
                 console.log('gpt user_prompt ', user_prompt);
    //         },
    //       ],
    //       max_tokens: 1000,
    //       temperature: 0,
    //     });
    
      const apiKey = this.apiKey || await this.retrieveApiKey(); 
      if (!apiKey) {
        console.error('API key not found');
        return;
      }
      const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:`Bearer ${'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'}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          //model: 'ft:gpt-4o-mini-2024-07-18:personal:second:AThf4LoS',
          messages: [
            {
              role: 'system',
              content: system_prompt,
            },
            {
              role: 'user',
              content: user_prompt,
            },
          ],
          temperature: 0,
          max_tokens: 500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        }),
      });

      const jsonResponse = await response.json();
      if (jsonResponse.error) {
        console.log('API Error:', jsonResponse.error);
        return null;
      }      
      const responseText = jsonResponse.choices[0].message.content;

      const advice = this.extractMovesFromResponse(responseText);
      //  console.log(`getDataFromGpt.advice ${JSON.stringify(advice,null,2)}`)
      return advice;
    } catch (error) {
      console.log('Error fetching analysis from AI:', error);
      return null;
    }
  }
//   async getAdviceFromGPTinstruct( user_prompt, system_prompt) {

//           // Combine system_prompt and user_prompt
//           const combinedPrompt = `${system_prompt}\n\n${user_prompt}`;

//     const apiKey = this.apiKey || await this.retrieveApiKey(); 
//     if (!apiKey) {
//       console.error('API key not found');
//       return;
//     }
//     const url = "https://api.openai.com/v1/completions";
//     const headers = {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${apiKey}`,
//     };
//     const data = {
//       model: 'gpt-3.5-turbo-instruct',
//       prompt: combinedPrompt,
//       temperature: 0.1,
//       max_tokens: 750,
//     };

//     try {
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: headers,
//         body: JSON.stringify(data),
//       });

//       const result = await response.json();
//       console.log(result);
//       if (response.ok) {
//         const gptResponseText = result.choices[0].text;
//         const gptResponse = JSON.parse(gptResponseText);
//         return gptResponse;
//       } else {
//         console.error("Error:", result);
//         Alert.alert("Error", "Failed to fetch data from OpenAI API");
//         return null;
//       }
//     } catch (error) {
//       console.error("Error fetching data from OpenAI API:", error);
//       Alert.alert("Error", "An error occurred while trying to fetch data from OpenAI API.");
//       return null;
//     }
    
//   }
//   async getAdviceFromGemini(system_prompt, user_prompt) {
//       // Combine system_prompt and user_prompt
//   const combinedPrompt = `${system_prompt}\n\n${user_prompt}`;

//     try {
//       console.log('Request Headers:', {
//         'Content-Type': 'application/json',
//     });
//     // Log the request body
//     console.log('Request Body:', {
//       "contents": [
//         {
//           "role": "user",
//           "parts": [{"text": combinedPrompt}]
//         },
//       ]
// });
//       const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           "contents": [
//             {
//               "role": "user",
//               "parts": [{"text": system_prompt + user_prompt}]
//             },
//           ]
//         }),
//       });
//       const data = await response.json();
     
//       if (data && data.candidates && data.candidates[0] && data.candidates[0].content){      // Extract the content from the response
//         let responseText = data.candidates[0].content.parts[0].text; ;
//         // Extract the sections from the response
//         const advice = this.extractSectionsFromAdvice(responseText); 
//         console.log(`gemini response ${responseText}`);
//         return advice;
//       } else {
//         console.log('No candidates found in Gemini API response.');
//         return null;
//       }
//     } catch (error) {
//       console.log('Error fetching analysis from Gemini:', error);
//       return null;
//     }
//   }
//   async getAdviceFromPerplexity(system_prompt, user_prompt) {
//     const response = await fetch(`https://api.perplexity.ai/chat/completions`,{
//     method: 'POST',
//     headers: {Authorization: 'Bearer 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', 
//                               'Content-Type': 'application/json'},
//     body: JSON.stringify({
//       model:"llama-3.1-sonar-huge-128k-online",
//       messages:[
//             {role:"system",
//               content:system_prompt
//             },
//             { role:"user",
//               content: user_prompt
//             }
//       ],
//       max_tokens:"1000",
//       temperature:0,
//       top_p:0.8,
//       return_citations:false,
//       search_domain_filter:["https://www.chess.com"],
//       return_images:false,
//       return_related_questions:false,
//       //search_recency_filter:"month",
//       top_k:0,
//       stream:false,
//       presence_penalty:0,
//       frequency_penalty:0.5
//     })
//     })
//     data = await response.json();
//     console.log(`perplexity response ${data}`);
//     // Extract the content from the response
//     if (data && data.choices && data.choices[0] && data.choices[0].message) {
//       let explanation = data.choices[0].message.content; // Adjust this depending on the exact content structure
//       // const responseText = jsonResponse.choices[0].message.content;
//       //  console.log(`explanation: ${explanation}`)
//       const advice= this.extractSectionsFromAdvice(explanation);
//       return advice;
//     }
//   }
  async getDataFromClaude(system_prompt, user_prompt) {
    try {
        //   // Log the request headers (mask the API key)
        //   console.log('Request Headers:', {
        //     'Content-Type': 'application/json',
        //     'anthropic-version': '2023-06-01',
        //     'x-api-key': '***MASKED_API_KEY***' // Masked for security
        // });
        // // Log the request body
        // console.log('Request Body:', {
        //     model: "claude-3-5-sonnet-20241022",
        //     max_tokens: 1000,
        console.log('claude system_prompt ',system_prompt);
        //     messages: [
        //         {
        //             role: "user",
        console.log('claude user_prompt ',user_prompt);
        //         },
        //     ]
        // });


        const apiKey = this.apiKey || await this.retrieveApiKey(); 
        //const apiKey = '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';
        if (!apiKey) {
          console.error('API key not found');
          return;
        }
        // console.log(apiKey);
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01' , // Add this line
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 300,
                system: system_prompt,
                messages: [

                    {
                      role: "user",
                      content: user_prompt
                  },
                ]
            })
        });

        const data = await response.json();
        if (data.error) {
          console.log('AI API Error:', data.error);
          return null;
        }

        //  console.log('Claude API Response:', JSON.stringify(data, null, 2));
        if (data && data.content && data.content[0] && data.content[0].text) {
            let explanation = data.content[0].text;
            const advice = this.extractReasoningFromResponse(explanation);
            // console.log(`after extracton ${advice}`)
            // console.log(`after extracton ${advice.recommendedNextMoves}`)

            // console.log(`after extracton ${advice.positionAnalysis}`)
            return advice;
        }
    } catch (error) {
        console.log('Error fetching analysis from Claude:', error);
        return null;
    }
  }
//   async getAdviceFromClaude_stream(system_prompt, user_prompt, options = {}) {
//     try {
//       const apiKey = this.apiKey || await this.retrieveApiKey();
//       if (!apiKey) {
//         console.error('API key not found');
//         return;
//       }

//       console.log('Making request to Claude API...');
//       const response = await fetch('https://api.anthropic.com/v1/messages', {
//         method: 'POST',
//         headers: 
//         {
//           'Content-Type': 'application/json',
//           'anthropic-version': '2023-06-01',
//           'x-api-key': apiKey,
//           'Accept': 'text/event-stream',
//           'anthropic-beta': 'prompt-caching-2024-07-31',
//           // 'Connection': 'keep-alive'
//         },
        
//         body: JSON.stringify({
//           model: "claude-3-5-sonnet-20241022",
//           max_tokens: 1000,
//           system:  [
//             {
//               "type": "text",
//               "text": system_prompt,
//               "cache_control": {"type": "ephemeral"}
//             }
//           ],
//           stream: true,
//           messages: [{
//             role: "user",
//             content: user_prompt
//           }]
//         })
//       });
//       console.log('Response status:', response.status);
   
//      const textStream = await response.text();
      
//      // Split the stream into lines and process each event
//      const lines = textStream.split('\n');
//      let accumulatedText = '';
//      let positionAnalysisExtracted = false;

//      for (const line of lines) {
//        if (!line.trim() || line === 'event: message_stop') continue;
       
//        if (line.startsWith('data: ')) {
//          try {
//            const jsonData = JSON.parse(line.slice(6));
//            //console.log('Parsed JSON:', jsonData);
           
//            // Handle content block deltas
//            if (jsonData.type === 'content_block_delta' && 
//                jsonData.delta && 
//                jsonData.delta.type === 'text_delta') {
//              accumulatedText += jsonData.delta.text;
//              //console.log('Updated text:', accumulatedText);
             
//              if (!positionAnalysisExtracted && options.onPositionAnalysis) {
//                if (accumulatedText.includes('"positionAnalysis"')) {
//                  const positionAnalysis = this.extractPositionAnalysis(accumulatedText);
//                  if (positionAnalysis) {
//                    console.log('position analysis extracted. Updated text:', accumulatedText);
//                    options.onPositionAnalysis(positionAnalysis);
//                    positionAnalysisExtracted = true;
//                  }
//                }
//              }
//            }
//          } catch (e) {
//            console.error('Error parsing stream data:', e, 'Line:', line);
//            continue;
//          }
//        }
//      }

//      console.log('Final accumulated text:', accumulatedText);
//      const advice = this.extractSectionsFromAdvice(accumulatedText);
//      return advice;
//    } catch (error) {
//      console.error('Error in streaming from Claude:', error);
//      return null;
//    }
// }
async getReasoningFromAI(apiName, advisedMoves) {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history().map((move) => move);
    const system_prompt =`
    You are a chess tutor specializing in accurate, move-by-move analysis.  
    You are playing Black. I am playing as White, and it's my turn to move.
    Instructions:
    - Analyze the given chess position thoroughly.
    - Double-check all tactical motifs and threats for accuracy.
    - Given a list of 3 moves, explain the benefits and risks of each

    Constraints:
    - Do not include move numbers, opening names, or acronyms.
    - Responses must strictly follow the specified JSON format.
    - Avoid referring to bishops by square colors
    - Do not include any additional text or explanations outside the JSON.
`;
//const advisedMovesString = JSON.stringify(advisedMoves);
const advisedMovesString = this.formatAdvisedMoves(advisedMoves);
// console.log('advisedMovesString ', advisedMovesString);

    const user_prompt = `
- Current FEN: 
${fen}
- Current game move history: 
${moveHistory}
- Current board setup: 
${this.chess.ascii()}
- Respond in the following JSON format:
Advised Moves:
${advisedMovesString}
{
  "positionAnalysis": "Brief analysis of the game.",
  "reasoning": [
    "Explanation for move 1.",
    "Explanation for move 2.",
    "Explanation for move 3."
      ]
}
  `;
    switch (apiName) {
      case 'GPT':
        return await this.getDataFromGPT(system_prompt, user_prompt);
    //   case 'Gemini':
    //     return await this.getAdviceFromGemini(system_prompt, user_prompt);
    //   case 'Perplexity':
    //     return await this.getAdviceFromPerplexity(system_prompt, user_prompt);   
      case 'Claude':
        return await this.getDataFromClaude(system_prompt, user_prompt);
    //     case 'Claude_stream':
    //       return await this.getAdviceFromClaude_stream(system_prompt, user_prompt, options); 
    //   case 'GPTinstruct':
    //     return await this.getAdviceFromGPTinstruct(system_prompt, user_prompt);               
      default:
        throw new Error(`Unknown API name: ${apiName}`);
    }
  }  
  formatAdvisedMoves(advisedMoves) {
    const moves = advisedMoves.recommendedNextMoves;
    let movesDescription = '';
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const moveNumber = i + 1;
      movesDescription += `move ${moveNumber}. ${move.move} (${move.priority.toLowerCase()} move), `;
    }
  
    // Remove the trailing comma and space at the end
    movesDescription = movesDescription.trim().replace(/,$/, '');
  
    return movesDescription;
  }
  extractPositionAnalysis(result) {
    try {
      const regex = /"positionAnalysis":\s*(\{[^}]*\})/;
      const match = result.match(regex);
      if (match) {
        const positionAnalysisJson = match[1];
        const positionAnalysis = JSON.parse(positionAnalysisJson);
        return positionAnalysis;
      }
    } catch (e) {
      // JSON is incomplete, continue accumulating
      return null;
    }
    return null;
  }
  extractReasoningFromResponse(adviceText) {
    try {
    //   console.log(`Raw advice text: ${adviceText}`);
      const cleanedText = adviceText.replace(/```(?:json)?/g, '').trim();
      const parsedResponse = JSON.parse(cleanedText);
    //   console.log('Parsed response:', parsedResponse);
      const { positionAnalysis, reasoning } = parsedResponse;
    //   console.log('positionAnalysis:', positionAnalysis);
    //   console.log('reasoning:', reasoning);
      return { positionAnalysis, reasoning };
    } catch (e) {
      console.log("Error parsing the assistant's response:", e);
      return null;
    }
  }  
  validateMove(sanMove) {
    const moves = this.chess.moves({ verbose: true });
    return moves.some((move) => move.san === sanMove);
  }
  convertMoveToDescription(sanMove, color) {
    // Get the current FEN
    const originalFEN = this.chess.fen();

    // Modify the FEN to switch the turn if necessary
    let modifiedFEN = originalFEN;
    if (color === 'b') {
      const fenParts = originalFEN.split(' ');
      fenParts[1] = 'b'; // Set turn to Black
      modifiedFEN = fenParts.join(' ');
    } else if (color === 'w') {
      const fenParts = originalFEN.split(' ');
      fenParts[1] = 'w'; // Ensure turn is White
      modifiedFEN = fenParts.join(' ');
    }

    // Create a new chess instance with the modified FEN
    const tempChess = new Chess(modifiedFEN);

    // Get all possible moves for the current turn
    const moves = tempChess.moves({ verbose: true });

    // Find the move matching the SAN notation
    const move = moves.find((m) => m.san === sanMove);

    if (move) {
      if (move.flags.includes('k') || move.flags.includes('q')) {
        // Handle castling
        const side = move.san === 'O-O' ? 'king-side' : 'queen-side';
        const from = move.from.toUpperCase();
        const to = move.to.toUpperCase();
        return `Castling ${side} from ${from} to ${to}`;
      } else {
        // Handle normal moves
        const pieceName = this.getPieceName(move.piece);
        const from = move.from.toUpperCase();
        const to = move.to.toUpperCase();
        const action = move.captured ? 'captures on' : 'to';
        const promotion = move.promotion ? ` and promotes to ${this.getPieceName(move.promotion)}` : '';
        return `${pieceName} from ${from} ${action} ${to}${promotion}`;
      }
    }

    // If move not found, return the SAN notation
    return sanMove;
  }
  getLastMoveByColor(color) {
    const history = this.chess.history({ verbose: true });
    // Filter for the most recent move of the specified color
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].color === color) {
        return history[i];
      }
    }
    return null; // No moves found for that color
  }
  getLastWhiteMove() {
    return this.getLastMoveByColor('w'); // 'w' for White
  }
  getLastBlackMove() {
    return this.getLastMoveByColor('b'); // 'b' for Black
  }
  getLegalMoves(position) {
    return this.chess.moves({ square: position, verbose: true });
  }
  getPieceName(pieceSymbol) {
    const pieceNames = {
      p: 'Pawn',
      n: 'Knight',
      b: 'Bishop',
      r: 'Rook',
      q: 'Queen',
      k: 'King',
    };
    return pieceNames[pieceSymbol.toLowerCase()] || 'Piece';
  }
  getMoveDetailsFromSAN(sanMove, fen = null) {
    const chessInstance = new Chess(fen || this.chess.fen());
    const moves = chessInstance.moves({ verbose: true });
    const move = moves.find((m) => m.san === sanMove);
    return move || null;
  }



}

export default GameLogic;