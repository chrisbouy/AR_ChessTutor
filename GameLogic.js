import { Chess } from 'chess.js';
import { validateFen } from "chess.js";
import { ToastAndroid } from 'react-native';
const { Engine } = require('./engines/wukong');
import EncryptedStorage from 'react-native-encrypted-storage';


const STARTING_PIECES = {
  white: { P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1 },
  black: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
};
const part1 = 'sk-proj-3nacw91YfJnezTJi_nxA_G';
const part2 = 'YTXPDGbDOLzswtyDQQAik6XLlV5';
const part3 = '7S_Zo2gQE_AeJJ1p9Mab3dqznT3Blbk';
const part4 = 'FJJ_Wg27V6_hApCNv7VUqMlHCk7Q-ap';
const part5 = 'BSLmSN_iO-9DdstJS3ISvN86pmNjGsukYYD23sYbiH_UA';



const part6 = 'sk-ant-api03-ddL-rMD4K';
const part7 = 'VfdbLD85KcTdmfAny';
const part8 = 'XybwRHAL9uLrY9sC9v4D-J';
const part9 = 'D5a0YE1fvPAdV26E75hk';
const part0 = 'oDzaOSTkIrPd-3Shzw-4I-2ogAA';

class GameLogic {
    constructor() {
      this.chess = new Chess();   
      this.latestAdvice = null; 
      this.engine = null; 
      this.moveCount = -1;
    }

    initializeEngine() {
      try {
        this.engine = new Engine();
        this.engine.setBoard(this.engine.START_FEN);
      } 
      catch (error) {
        console.error('Failed to initialize the engine:', error);
      } 
      //midgame
       this.chess.load("r1bq1rk1/pppn1ppp/4pn2/3P4/2P2B2/2N2N2/PP3PPP/R2QKB1R w KQ - 1 9");
      //end game
 //this.chess.load("8/5P2/8/8/8/8/8/4k2K w - - 0 1");
    }

    getBoardState() {
        const board = this.chess.board();
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        return board.map((row, rowIndex) => {
            return row.map((piece, colIndex) => {
                const position = files[colIndex] + (8 - rowIndex);
                const squareColor = (rowIndex + colIndex) % 2 === 0 ? '#080100' : '#5c5d5e';
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
        return null;
      }
      // Check if this is a pawn promotion move
      const isPawnPromotion =
      this.chess.get(move.from).type === "p" && // The piece being moved is a pawn
      (move.to.endsWith("8")); // The destination is the back rank

      if (isPawnPromotion) {
        move.promotion = "q"; // Automatically promote to a queen (you can modify this as needed)
      }
      const result = this.chess.move(move); 

      if (result) {
        this.engine.makeMove(this.encodeMove(move));
        this.engine.setBoard(this.chess.fen());
        return result;
      }
    }
    catch {
        console.log('Error making move');
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
      // console.log('encoding');
      let promotedPiece = (this.engine.getSide() ? (5 + 6): 5) // queen promotion only for now
      let validMove = move.from + move.to + this.engine.promotedToString(promotedPiece);
      // console.log('validMove ',validMove);
      let encodedMove = this.engine.moveFromString(validMove);
      // console.log('encodedMove ', encodedMove);
      return this.encodeMove;
    }

    decodeMove(encodedMove) {
      // Ensure the engine is initialized
      if (!this.engine) {
          console.error('Engine is not initialized.');
          return null;
      }
  
      try {
          // Get source and target squares
          const sourceSquare = this.engine.getMoveSource(encodedMove);
          const targetSquare = this.engine.getMoveTarget(encodedMove);
  
          // Convert source and target squares from internal representation to algebraic notation
          const source = this.engine.squareToString(sourceSquare);
          const target = this.engine.squareToString(targetSquare);
  
          // Check for promotion
          const promotedPiece = this.engine.getMovePromoted(encodedMove);
          let promotionSuffix = '';
          if (promotedPiece) {
              const promotedSAN = this.engine.promotedToString(promotedPiece).toLowerCase();
              promotionSuffix = `=${promotedSAN.toUpperCase()}`;
          }
  
          // Construct SAN move
          const sanMove = `${source}${target}${promotionSuffix}`;
          // console.log('Decoded SAN move:', sanMove);
          return sanMove;
      } catch (error) {
          console.error('Error decoding move:', error);
          return null;
      }
    }

    makeMove_Black(whiteMove) {  
        const originalFEN = this.chess.fen();
        const advisedMoves = this.latestAdvice?.advisedMoves || [];
        const advisedMove = advisedMoves.find(advice => advice.san === whiteMove);
        const addPromotionIfNeeded = (move) => {
          const isPawnPromotion =
              this.chess.get(move.from).type === "p" && // The piece being moved is a pawn
              move.to.endsWith("1"); // The destination is the back rank for Black
          if (isPawnPromotion) {
              move.promotion = "q"; // Automatically promote to a queen
          }
        };
        if (advisedMove) {
            const blackResponses = advisedMove.likelyResponses;
            const selectedMove = blackResponses[Math.floor(Math.random() * blackResponses.length)];
            addPromotionIfNeeded(selectedMove.move);
            this.chess.move(selectedMove.move); // Make Black's response
            this.engine.makeMove(selectedMove.move);
             this.engine.setBoard(this.chess.fen());
            return {
                move: selectedMove.move,
                boardState: this.getBoardState(),
                status: this.getGameStatus(),
            };
        } else {
             let searchResult = this.engine.search(4, this.chess.fen()); 
             this.engine.makeMove(searchResult.bestMove);
            const decodedbestmove = this.decodeMove(searchResult.bestMove);
            addPromotionIfNeeded(decodedbestmove);
             this.chess.move(decodedbestmove);
            return {
                move: decodedbestmove,
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
      // console.log('----fen at start of gettabledata-----', this.chess.fen());
      // this.engine.printBoard();
      let advisedMoves = [];
      const maxAdvisedMoves = 5;
      const maxLikelyResponses = 2;
      const maxsearchforresponses = 10;
      const depths = [5, 4, 3];
      let checkmateMove = null;
    
      for (const depth of depths) {
        if (advisedMoves.length >= maxAdvisedMoves) break;
        const searchResult = this.engine.search(depth, this.chess.fen());
        const primaryVariant = searchResult.info.match(/pv (.+)/)[1].split(' ');
        const infoParts = searchResult.info.split(' ');
        const cpIndex = infoParts.indexOf('cp');
        let score = 0;
        if (cpIndex !== -1 && cpIndex + 1 < infoParts.length) {
          score = parseInt(infoParts[cpIndex + 1], 10);
        }
        const advisedMove = primaryVariant[0];
        if (!advisedMoves.some((move) => move.move === advisedMove)) {
          const fenBeforeMove = this.chess.fen();  
          // console.log('encoded white move:',searchResult.bestMove);        
          // this.engine.makeMove(searchResult.bestMove);
          // console.log('uci white move:',advisedMove);

          this.chess.move(advisedMove);
          const fenAfterMove = this.chess.fen();

          if (this.chess.isCheckmate()) {
            checkmateMove = {
              san: this.convertFromSquareToSan(advisedMove, fenBeforeMove),
              move: advisedMove,
              score: score,
              description: this.convertMoveToDescription(advisedMove, 'w') + ' (CHECKMATE)',
              likelyResponses: [], // No responses for a checkmate move
              fenAfterMove,
            };
          }

          this.chess.undo();

          // console.log('fen after making white advised move', this.chess.fen());
          // this.engine.printBoard();
          const sanMove = this.convertFromSquareToSan(advisedMove, fenBeforeMove);

          if (!checkmateMove) {
            advisedMoves.push({
              san: sanMove,
              move: advisedMove,
              encoded: searchResult.bestMove,
              score:score,
              fenAfterMove,
              likelyResponses: [primaryVariant[1]],
            });
            // this.engine.takeBack();
          }
        }
      }
      if (checkmateMove) {
        advisedMoves = [checkmateMove];
      } else {
        const uniqueMap = new Map();
        advisedMoves.forEach(item => {
          if (!uniqueMap.has(item.move) || uniqueMap.get(item.move).score < item.score) {
            uniqueMap.set(item.move, item);
          }
        });
        advisedMoves = Array.from(uniqueMap.values());

        // Then, sort advisedMoves by score (descending)
        advisedMoves.sort((a, b) => b.score - a.score);
        // console.log('-black responses-');
        advisedMoves.forEach((advisedMove) => {
          const originalFen = this.chess.fen();
          // console.log('making white advised move:',advisedMove.move);
          this.chess.move(advisedMove.move);
          // console.log('white encoded:',advisedMove.encoded);
          this.engine.makeMove(advisedMove.encoded);
          //this.engine.setBoard(this.chess.fen());
          const likelyResponses = [];

          const responseresult = this.engine.search(4, this.chess.fen())
          const primaryVariant = responseresult.info.match(/pv (.+)/)[1].split(' ');
          // console.log(`pv afer ${advisedMove.move} : ${primaryVariant}`);
          // console.log('pushing pv[1] if unique', primaryVariant[0]);
          likelyResponses.push(advisedMove.likelyResponses[0]);
          if (primaryVariant[0] !== advisedMove.likelyResponses[0]) 
            likelyResponses.push(primaryVariant[0]);
          else
            // console.log('not unique');
          loopsforresponses=0;
          while (likelyResponses.length < maxLikelyResponses && loopsforresponses <= maxsearchforresponses) {
            const response = this.engine.search(1, this.chess.fen());
            const responseMove = response.info.match(/pv (.+)/)[1].split(' ')[0];
            if (!likelyResponses.includes(responseMove)) {
              likelyResponses.push(responseMove);
            }
            loopsforresponses++;
          }
          advisedMove.likelyResponses = likelyResponses.map((response) => {
            // console.log('black move ',response);
            const sanresponse = this.convertFromSquareToSan(response, advisedMove.fenAfterMove);
            // console.log('black san ', sanresponse);
            return {
              move: response,
              san: sanresponse,
            };
          });
          //this.chess.undo();
          this.chess.load(originalFen); // Restore FEN

          this.engine.takeBack();
          
        });
      }
      //       // After advisedMoves are fully populated
      advisedMoves.forEach((advisedMove) => {
        // White move description
        // console.log('advisedMove.san ',advisedMove.san);
        advisedMove.description = this.convertMoveToDescription(advisedMove.san, 'w');
         console.log('advisedMove.description ',advisedMove.description);


        // Black move descriptions
        advisedMove.likelyResponses.forEach((response) => {
          // console.log('response.san ',response.san);
          response.description = this.convertMoveToDescription(response.san, 'b');
          // console.log('response.description ',response.description);

        });
      });

      // Calculate moveIndex based on full moves (each full move has White and Black)
      const moveNumber = Math.floor(this.chess.history().length / 2) + 1;

      if (!this.moveCount) {
        this.moveCount = 0;
      }
      this.moveCount++; // Increment on each black move
    
      const adviceEntry = {
        isCurrentlyDisplayed: true,
          moveIndex: this.moveCount, // Add moveIndex here  
          fen: this.chess.fen(), // FEN after Black's move
          advisedMoves,
      };

       // console.log(JSON.stringify(adviceEntry, null, 2));
      // this.latestAdvice = adviceEntry; 
      return adviceEntry; 
    }
    async storeApiKey(key) {
      try {
        const apiKey = part6 + part7 + part8 + part9 + part0;

        console.log('storing: ', apiKey);
        //const obfuscatedKey = btoa(part1 + part2 + part3 + part4 + part5);
        const obfuscatedKey = btoa(part6 + part7 + part8 + part9 + part0);
        await EncryptedStorage.setItem('apiKey', obfuscatedKey);
        console.log('stored: ', obfuscatedKey);
        this.apiKey = obfuscatedKey; // Optionally update the instance variable
      } catch (error) {
        console.error('Error storing the API key:', error);
      }
    }
    async retrieveApiKey() {
      try {
        console.log('retrieving');
        const obfuscatedKey = await EncryptedStorage.getItem('apiKey');
        if (obfuscatedKey) {
          const decodedKey = atob(obfuscatedKey); 
          console.log('retrieved: ',decodedKey);
          this.apiKey = decodedKey; // Store it in the instance variable
          return decodedKey;
        } else {
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
        // console.log('gpt system_prompt ',system_prompt);
        // console.log('gpt user_prompt ', user_prompt);
        // const apiKey = this.apiKey || await this.retrieveApiKey(); 
        // if (!apiKey) {
        //   console.error('API key not found');
        //   return;
        // }
        const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:`Bearer ${'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'}`
          },
          body: JSON.stringify({
            model: 'o1-preview-2024-09-12',
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
            temperature: 1,
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
        const advice = this.extractReasoningFromResponse(responseText);
         console.log(`getDataFromGpt.advice ${JSON.stringify(advice,null,2)}`)
        return advice;
      } catch (error) {
        console.log('Error fetching analysis from AI:', error);
        return null;
      }
    }
    async getDataFromGPTo1(system_prompt, user_prompt) {
      try {
        // console.log('gpt system_prompt ',system_prompt);
        // console.log('gpt user_prompt ', user_prompt);
        const combinedPrompt = `${system_prompt}\n\n${user_prompt}`;
        // const apiKey = this.apiKey || await this.retrieveApiKey(); 
        // if (!apiKey) {
        //   console.error('API key not found');
        //   return;
        // }
        const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:`Bearer ${'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'}`
          },
          body: JSON.stringify({
            model: 'o1-mini',
            //model: 'ft:gpt-4o-mini-2024-07-18:personal:second:AThf4LoS',
            messages: [
              {
                role: 'user',
                content: combinedPrompt,
              },
            ],

          }),
        });
        const jsonResponse = await response.json();
        if (jsonResponse.error) {
          console.log('API Error:', jsonResponse.error);
          return null;
        }      
        // console.log(jsonResponse);
        const responseText = jsonResponse.choices[0].message.content;
        // console.log(`getDataFromGpt.responseText ${JSON.stringify(responseText,null,2)}`)
        const advice = this.extractReasoningFromResponse(responseText);
        // console.log(`getDataFromGpt.advice ${JSON.stringify(advice,null,2)}`)
        return advice;
      } catch (error) {
        console.log('Error fetching analysis from AI:', error);
        return null;
      }
    }    
    async getAdviceFromGPTinstruct( user_prompt, system_prompt) {

            // Combine system_prompt and user_prompt
            const combinedPrompt = `${system_prompt}\n\n${user_prompt}`;

      const apiKey = this.apiKey || await this.retrieveApiKey(); 
      if (!apiKey) {
        console.error('API key not found');
        return;
      }
      const url = "https://api.openai.com/v1/completions";
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      };
      const data = {
        model: 'go1-preview-2024-09-12',
        prompt: combinedPrompt,
        temperature: 0.1,
        max_tokens: 750,
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log(result);
        if (response.ok) {
          const gptResponseText = result.choices[0].text;
          const gptResponse = JSON.parse(gptResponseText);
          return gptResponse;
        } else {
          console.error("Error:", result);
          Alert.alert("Error", "Failed to fetch data from OpenAI API");
          return null;
        }
      } catch (error) {
        console.error("Error fetching data from OpenAI API:", error);
        Alert.alert("Error", "An error occurred while trying to fetch data from OpenAI API.");
        return null;
      }
      
    }
    async getAdviceFromGemini(system_prompt, user_prompt) {
        // Combine system_prompt and user_prompt
    const combinedPrompt = `${system_prompt}\n\n${user_prompt}`;

      try {
        console.log('Request Headers:', {
          'Content-Type': 'application/json',
      });
      // Log the request body
      console.log('Request Body:', {
        "contents": [
          {
            "role": "user",
            "parts": [{"text": combinedPrompt}]
          },
        ]
  });
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            "contents": [
              {
                "role": "user",
                "parts": [{"text": system_prompt + user_prompt}]
              },
            ]
          }),
        });
        const data = await response.json();
      
        if (data && data.candidates && data.candidates[0] && data.candidates[0].content){      // Extract the content from the response
          let responseText = data.candidates[0].content.parts[0].text; ;
          // Extract the sections from the response
          const advice = this.extractReasoningFromResponse(responseText); 
          console.log(`gemini response ${responseText}`);
          return advice;
        } else {
          console.log('No candidates found in Gemini API response.');
          return null;
        }
      } catch (error) {
        console.log('Error fetching analysis from Gemini:', error);
        return null;
      }
    }
    async getAdviceFromGemini2(system_prompt, user_prompt) {
      const combinedPrompt = `${system_prompt}\n\n${user_prompt}`;
      console.log(combinedPrompt);
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI("AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = combinedPrompt;
      const result = await model.generateContent(prompt);
      console.log(result.response.text());

        // Use regex to extract the JSON part
      //   const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      //   const extractedJSON = '';
      //   if (jsonMatch) {
      //      extractedJSON = JSON.parse(jsonMatch[0]); // Parse the JSON part
      //     console.log('Extracted JSON:', extractedJSON);
      //   } else {
      //     console.error('No JSON found in the response');
      //   }

      // const advice = this.extractReasoningFromResponse(extractedJSON); 
      const advice = this.extractReasoningFromResponse(result.response.text()); 
      return advice;
  }
    async getAdviceFromPerplexity(system_prompt, user_prompt) {
      const response = await fetch(`https://api.perplexity.ai/chat/completions`,{
      method: 'POST',
      headers: {Authorization: 'Bearer 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', 
                                'Content-Type': 'application/json'},
      body: JSON.stringify({
        model:"llama-3.1-sonar-large-128k-online",
        messages:[
              {role:"system",
                content:system_prompt
              },
              { role:"user",
                content: user_prompt
              }
        ],
        max_tokens:"200",
        temperature:1,
        top_p:1,
        return_citations:false,
        search_domain_filter:["https://www.chess.com"],
        return_images:false,
        return_related_questions:false,
        //search_recency_filter:"month",
        top_k:0,
        stream:false,
        presence_penalty:0,
        frequency_penalty:0.5
      })
      })
      data = await response.json();
      console.log(`perplexity response ${JSON.stringify(data)}`);
      // Extract the content from the response
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        let explanation = data.choices[0].message.content; // Adjust this depending on the exact content structure
        // const responseText = jsonResponse.choices[0].message.content;
          console.log(`explanation: ${explanation}`)
        const advice= this.extractReasoningFromResponse(explanation);
        return advice;
      }
    }
    async getDataFromClaude(system_prompt, user_prompt) {
      try {
        
          // console.log('claude system_prompt ',system_prompt);
          // console.log('claude user_prompt ',user_prompt);
          const apiKey =  await this.retrieveApiKey(); 
          // const apiKey = this.apiKey || await this.retrieveApiKey(); 
   
          //const apiKey = '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';
          if (!apiKey) {
            console.error('API key not found');
            return;
          }
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
          // console.log('Claude API Response:', JSON.stringify(data, null, 2));
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
    async getAdviceFromClaude_stream(system_prompt, user_prompt) {
      console.log('claude stream starting');
      try {
        const apiKey = await this.retrieveApiKey();
        if (!apiKey) {
          console.error('API key not found');
          return;
        }

        console.log('Making request to Claude API...');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'x-api-key': apiKey,
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify({
            model: "claude-3-sonnet-20240229",
            max_tokens: 500,
            temperature: 0.7,
            system: system_prompt,
            messages: [{
              role: "user",
              content: user_prompt
            }],
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        let accumulatedText = '';
        let buffer = '';

        while (true) {
          const {value, done} = await reader.read();
          if (done) break;
          
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim() || line.trim() === 'data: [DONE]') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.slice(6));
                if (jsonData.type === 'message_start') continue;
                if (jsonData.type === 'content_block_start') continue;
                if (jsonData.type === 'content_block_stop') continue;
                if (jsonData.type === 'message_stop') break;

                if (jsonData.type === 'content_block_delta' && 
                    jsonData.delta?.type === 'text_delta') {
                  accumulatedText += jsonData.delta.text;
                  console.log('New text chunk:', jsonData.delta.text);
                }
              } catch (e) {
                console.error('Error parsing stream chunk:', e);
                continue;
              }
            }
          }
        }

        console.log('Stream complete. Final text:', accumulatedText);
        return this.extractReasoningFromResponse(accumulatedText);
      } catch (error) {
        console.error('Error in streaming from Claude:', error);
        return null;
      }
    }
    async getReasoningFromAI(apiName, advisedMoves) {
      const fen = this.chess.fen();
      const moveHistory =this.chess.history().map((move) => move);
      console.log('history',moveHistory);
      const system_prompt =`
      You are a chess tutor specializing in accurate, move-by-move analysis.  
      You are playing Black. I am playing as White, and it's my turn to move.
      I am learning chess strategies and you are my teacher.

      Constraints:
      - Do not include move numbers, opening names, or acronyms.
      - Responses must strictly follow the specified JSON format.
      - When discussing bishops, use their starting squares (f1 bishop, c8 bishop) or their position on the board.
      - When discussing castling, do not specify kingside or queenside.  
      - It is imperative that you do not include any additional text or explanations outside the required JSON.
      - Focus moreso on the positives of the proposed move.
      `;
      //const advisedMovesString = JSON.stringify(advisedMoves);
      const advisedMovesString = this.formatAdvisedMoves(advisedMoves);
        console.log('getreasoningfromai.advisedMovesString ', advisedMovesString);
      const user_prompt = `
        - Current FEN: 
        ${fen}

        - Current game move history: 
        ${moveHistory.join(', ')}

        - Current board setup: 
${this.chess.ascii()} 

        - Advised Moves:
        ${advisedMovesString}

        - Respond in the following JSON format:
        {
          "positionAnalysis": "An insightful 30 word analysis of the game.",
          "reasoning": [
            "This is the strongest move produced by the chess engine.  Explain the benefits and risks",
            "This is the 2nd strongest move produced by the chess engine.  Explain the benefits and risks",
            "This is the 3rd strongest move produced by the chess engine.  Explain the benefits and risks"
              ]
        }
    `;
      switch (apiName) {
        case 'GPT':
          return await this.getDataFromGPT(system_prompt, user_prompt);
        case 'GPTo1':
          return await this.getDataFromGPTo1(system_prompt, user_prompt);          
        case 'Gemini':
          return await this.getAdviceFromGemini(system_prompt, user_prompt);
          case 'Gemini2':
            return await this.getAdviceFromGemini2(system_prompt, user_prompt);
  
        case 'Perplexity':
          return await this.getAdviceFromPerplexity(system_prompt, user_prompt);   
        case 'Claude':
          return await this.getDataFromClaude(system_prompt, user_prompt);
          case 'Claude_stream':
            console.log('entering claude stream');
            return await this.getAdviceFromClaude_stream(system_prompt, user_prompt, options); 
        case 'GPTinstruct':
          return await this.getAdviceFromGPTinstruct(system_prompt, user_prompt);               
        default:
          throw new Error(`Unknown API name: ${apiName}`);
      }
    }  
    formatAdvisedMoves(advisedMoves) {
      // console.log('advisedMoves', advisedMoves);
    
      let movesDescription = '';
    
      for (let i = 0; i < advisedMoves.length; i++) {
        const move = advisedMoves[i];
        const moveNumber = i + 1;
    
        // Add the advised move description
        movesDescription += `${moveNumber}) ${move.description}, Likely responses to this move are: `;
    
        // Loop through the likely responses (limit to the first 2 if available)
        for (let j = 0; j < Math.min(move.likelyResponses.length, 2); j++) {
          const response = move.likelyResponses[j];
          movesDescription += `${response.san}`;
          if (j < Math.min(move.likelyResponses.length, 2) - 1) {
            movesDescription += ' or '; // Add a comma between responses
          }
        }
    
        // Add a period at the end of the likely responses for this move
        movesDescription += '.\n';
      }
    
      // Remove the trailing space and ensure clean formatting
      movesDescription = movesDescription.trim();
    
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
      const moves = tempChess.moves({ verbose: true });
      // console.log('Available moves:', moves.map((m) => m.san));
      // console.log('SAN move passed:', sanMove);
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
    
    getRecentMoves() {
      const history = this.chess.history({ verbose: true });
      
      // Safeguard: Return empty array if no history exists
      if (!history || history.length === 0) {
        // console.log('getRecentMoves: No moves yet');
        return [];
      }

      const moves = [];
      const moveIndex = Math.max(0, history.length - 2); // Get last 2 moves

      for (let i = moveIndex; i < history.length; i++) {
        const move = history[i];
        const moveNumber = Math.ceil((i + 1) / 2); // Calculate full-move number
        const player = i % 2 === 0 ? 'White' : 'Black';
        moves.push(`${player} ${this.describeMove(move)}`);
      }

      // console.log('getRecentMoves.moves', moves);
      return moves; // Always return an array
    }

    describeMove(move) {
      // Map chess piece abbreviations to full names
      const getFullPieceName = (piece) => {
        switch (piece.toLowerCase()) {
          case 'p': return 'Pawn';
          case 'r': return 'Rook';
          case 'n': return 'Knight';
          case 'b': return 'Bishop';
          case 'q': return 'Queen';
          case 'k': return 'King';
          default: return 'Unknown';
        }
      };

      const piece = getFullPieceName(move.piece); // Convert piece abbreviation to full name
      const from = move.from; // Starting square
      const to = move.to; // Ending square
      const isCapture = move.flags.includes('c') ? 'captures on' : 'to'; // Check for capture flag

      return `${piece} from ${from} ${isCapture} ${to}`;
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
    convertFromSquareToSan(move, fen) {
      // Load the FEN to set the board state
     this.chess.load(fen);
    
      // Get all legal moves in verbose format
      const legalMoves = this.chess.moves({ verbose: true });
    //console.log('all legal moves', legalMoves);
      // Find the move in the verbose list
      const sanMove = legalMoves.find(
        (m) => `${m.from}${m.to}` === move
      )?.san;
    // console.log('san:',sanMove);
      // Return the SAN move or fallback to the original move
      return sanMove || move;
    }
      // Method to get the current FEN string
    getFen() {
      return this.chess.fen();
    }

    // Method to load a FEN string
    loadFen(fen) {
      this.chess.load(fen);
      this.engine.setBoard(fen);
    }
    //deduce captured pieces
    getCapturedMaterial() {
      const fen = this.chess.fen();
      const pieceCount = {
        white: { P: 0, N: 0, B: 0, R: 0, Q: 0, K: 0 },
        black: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      };
  
      // Extract the board part of the FEN string
      const board = fen.split(' ')[0];
  
      // Count pieces currently on the board
      for (const char of board) {
        if (STARTING_PIECES.white[char] !== undefined) {
          pieceCount.white[char]++;
        } else if (STARTING_PIECES.black[char] !== undefined) {
          pieceCount.black[char]++;
        }
      }
  
      // Deduce captured pieces
      const capturedPieces = {
        white: {},
        black: {},
      };
  
      Object.keys(STARTING_PIECES.white).forEach((piece) => {
        const captured = STARTING_PIECES.white[piece] - pieceCount.white[piece];
        if (captured > 0) {
          capturedPieces.white[piece] = captured;
        }
      });
  
      Object.keys(STARTING_PIECES.black).forEach((piece) => {
        const captured = STARTING_PIECES.black[piece] - pieceCount.black[piece];
        if (captured > 0) {
          capturedPieces.black[piece] = captured;
        }
      });
  
      return capturedPieces;
    }
}

export default GameLogic;
