/************************************************\
===============================================

                      WUKONG
              JavaScript Chess Engine
                  Version 2.0

                          by

                   Code Assistant

===============================================
\************************************************/

// Chess engine object
var Engine = function() {

  /****************************\
   ============================
   
         GLOBAL CONSTANTS

   ============================              
  \****************************/

  // Engine version
  const VERSION = '2.0';
  const ELO = '1920';

  // Sides to move
  const WHITE = 0;
  const BLACK = 1;

  // Piece types
  const EMPTY = 0;
  const PAWN = 1;
  const KNIGHT = 2;
  const BISHOP = 3;
  const ROOK = 4;
  const QUEEN = 5;
  const KING = 6;

  // Piece codes
  const PIECES = {
    'P': PAWN,
    'N': KNIGHT,
    'B': BISHOP,
    'R': ROOK,
    'Q': QUEEN,
    'K': KING,
    'p': -PAWN,
    'n': -KNIGHT,
    'b': -BISHOP,
    'r': -ROOK,
    'q': -QUEEN,
    'k': -KING
  };

  // Square constants
  const SQUARES = {};
  const FILES = 'abcdefgh';
  const RANKS = '12345678';
  let squareIndex = 0;
  for (let rank = 8; rank >= 1; rank--) {
    for (let file = 0; file < 8; file++) {
      const square = FILES[file] + rank;
      SQUARES[square] = squareIndex;
      squareIndex++;
    }
  }

  // Directions
  const DIRECTIONS = {
    PAWN: [[-8, -16, -7, -9], [8, 16, 9, 7]], // [WHITE, BLACK]
    KNIGHT: [-17, -15, -10, -6, 6, 10, 15, 17],
    BISHOP: [-9, -7, 7, 9],
    ROOK: [-8, -1, 1, 8],
    QUEEN: [-9, -8, -7, -1, 1, 7, 8, 9],
    KING: [-9, -8, -7, -1, 1, 7, 8, 9]
  };

  // Board representation
  let board = new Array(128);
  let sideToMove;
  let castlingRights;
  let enPassantSquare;
  let halfMoveClock;
  let fullMoveNumber;
  let kingSquare = { [WHITE]: null, [BLACK]: null };

  // Move history
  let moveStack = [];

  // Transposition table
  let transpositionTable = {};

  // Search parameters
  let nodes;
  let searchDepth;
  let timing = {
    timeSet: false,
    stopTime: null,
    stopped: false
  };

  // Constants for search
  const MAX_DEPTH = 64;
  const INFINITY = 100000;
  const MATE_SCORE = 90000;
  const MATE_THRESHOLD = 80000;

  // Multi-PV parameters
  const PV_COUNT = 3;

  // Initialization
  function initialize() {
    resetBoard();
  }

  // Reset the board to the initial position
  function resetBoard() {
    const initialFEN = 'rn1qkbnr/ppp1pppp/8/3p4/8/3P4/PPP1PPPP/RNBQKBNR w KQkq - 0 2';
    setFEN(initialFEN);
  }

  /****************************\
   ============================
   
            FEN PARSER

   ============================              
  \****************************/

  function setFEN(fen) {
    const parts = fen.split(' ');
    const position = parts[0];
    const side = parts[1];
    const castling = parts[2];
    const enPassant = parts[3];
    const halfMove = parseInt(parts[4]);
    const fullMove = parseInt(parts[5]);

    // Clear board
    board = new Array(128);
    for (let i = 0; i < 128; i++) {
      board[i] = null;
    }

    // Set pieces
    let squareIndex = 0;
    for (let char of position) {
      if (char === '/') {
        continue;
      }
      if (char >= '1' && char <= '8') {
        squareIndex += parseInt(char);
      } else {
        const piece = PIECES[char];
        if (piece === KING) {
          kingSquare[WHITE] = squareIndex;
        } else if (piece === -KING) {
          kingSquare[BLACK] = squareIndex;
        }
        board[squareIndex] = piece;
        squareIndex++;
      }
    }

    // Set side to move
    sideToMove = (side === 'w') ? WHITE : BLACK;

    // Set castling rights
    castlingRights = 0;
    if (castling.includes('K')) castlingRights |= 1;
    if (castling.includes('Q')) castlingRights |= 2;
    if (castling.includes('k')) castlingRights |= 4;
    if (castling.includes('q')) castlingRights |= 8;

    // Set en passant square
    enPassantSquare = (enPassant === '-') ? null : SQUARES[enPassant];

    // Set half move clock and full move number
    halfMoveClock = halfMove;
    fullMoveNumber = fullMove;

    // Clear move history and transposition table
    moveStack = [];
    transpositionTable = {};
  }

  /****************************\
   ============================
   
          MOVE GENERATION

   ============================              
  \****************************/

  function generateLegalMoves() {
    const moves = generatePseudoLegalMoves();
    const legalMoves = [];
    for (let move of moves) {
      makeMove(move);
      if (!isKingAttacked(sideToMove ^ 1)) {
        legalMoves.push(move);
      }
      undoMove();
    }
    return legalMoves;
  }

  function generatePseudoLegalMoves() {
    const moves = [];
    for (let square = 0; square < 128; square++) {
      if ((square & 0x88) !== 0) continue;
      const piece = board[square];
      if (piece === null || Math.sign(piece) !== (sideToMove === WHITE ? 1 : -1)) continue;
      const pieceType = Math.abs(piece);

      if (pieceType === PAWN) {
        generatePawnMoves(square, moves);
      } else if (pieceType === KNIGHT) {
        generatePieceMoves(square, DIRECTIONS.KNIGHT, false, moves);
      } else if (pieceType === BISHOP) {
        generatePieceMoves(square, DIRECTIONS.BISHOP, true, moves);
      } else if (pieceType === ROOK) {
        generatePieceMoves(square, DIRECTIONS.ROOK, true, moves);
      } else if (pieceType === QUEEN) {
        generatePieceMoves(square, DIRECTIONS.QUEEN, true, moves);
      } else if (pieceType === KING) {
        generatePieceMoves(square, DIRECTIONS.KING, false, moves);
        generateCastlingMoves(square, moves);
      }
    }
    return moves;
  }

  function generatePawnMoves(square, moves) {
    const pawnDirection = sideToMove === WHITE ? -16 : 16;
    const startRank = sideToMove === WHITE ? 6 : 1;
    const promotionRank = sideToMove === WHITE ? 0 : 7;
    const rank = square >> 4;

    // Single push
    let toSquare = square + pawnDirection;
    if (board[toSquare] === null) {
      if ((toSquare >> 4) === promotionRank) {
        // Promotion
        moves.push(createMove(square, toSquare, QUEEN));
        moves.push(createMove(square, toSquare, ROOK));
        moves.push(createMove(square, toSquare, BISHOP));
        moves.push(createMove(square, toSquare, KNIGHT));
      } else {
        moves.push(createMove(square, toSquare));
        // Double push
        if (rank === startRank) {
          toSquare += pawnDirection;
          if (board[toSquare] === null) {
            moves.push(createMove(square, toSquare));
          }
        }
      }
    }

    // Captures
    for (let offset of [-17, -15]) {
      toSquare = square + pawnDirection + offset;
      if ((toSquare & 0x88) !== 0) continue;
      if (board[toSquare] !== null && Math.sign(board[toSquare]) !== Math.sign(board[square])) {
        if ((toSquare >> 4) === promotionRank) {
          // Promotion capture
          moves.push(createMove(square, toSquare, QUEEN));
          moves.push(createMove(square, toSquare, ROOK));
          moves.push(createMove(square, toSquare, BISHOP));
          moves.push(createMove(square, toSquare, KNIGHT));
        } else {
          moves.push(createMove(square, toSquare));
        }
      }
      // En passant
      if (toSquare === enPassantSquare) {
        moves.push(createMove(square, toSquare, null, true));
      }
    }
  }

  function generatePieceMoves(square, offsets, isSliding, moves) {
    const piece = board[square];
    for (let offset of offsets) {
      let toSquare = square;
      while (true) {
        toSquare += offset;
        if ((toSquare & 0x88) !== 0) break;
        if (board[toSquare] === null) {
          moves.push(createMove(square, toSquare));
        } else {
          if (Math.sign(board[toSquare]) !== Math.sign(piece)) {
            moves.push(createMove(square, toSquare));
          }
          break;
        }
        if (!isSliding) break;
      }
    }
  }

  function generateCastlingMoves(square, moves) {
    if (isKingAttacked(sideToMove)) return;

    const kingSide = sideToMove === WHITE ? 1 : 4;
    const queenSide = sideToMove === WHITE ? 2 : 8;

    // King-side castling
    if ((castlingRights & kingSide) !== 0) {
      const emptySquares = sideToMove === WHITE ? [5, 6] : [117, 118];
      if (board[emptySquares[0]] === null && board[emptySquares[1]] === null) {
        if (!isSquareAttacked(emptySquares[0], sideToMove ^ 1) && !isSquareAttacked(emptySquares[1], sideToMove ^ 1)) {
          moves.push(createMove(square, emptySquares[1], null, false, true));
        }
      }
    }

    // Queen-side castling
    if ((castlingRights & queenSide) !== 0) {
      const emptySquares = sideToMove === WHITE ? [1, 2, 3] : [113, 114, 115];
      if (board[emptySquares[0]] === null && board[emptySquares[1]] === null && board[emptySquares[2]] === null) {
        if (!isSquareAttacked(emptySquares[1], sideToMove ^ 1) && !isSquareAttacked(emptySquares[2], sideToMove ^ 1)) {
          moves.push(createMove(square, emptySquares[2], null, false, true));
        }
      }
    }
  }

  function createMove(from, to, promotion = null, isEnPassant = false, isCastling = false) {
    return {
      from: from,
      to: to,
      promotion: promotion,
      isEnPassant: isEnPassant,
      isCastling: isCastling
    };
  }

  /****************************\
   ============================
   
          MOVE EXECUTION

   ============================              
  \****************************/

  function makeMove(move) {
    const piece = board[move.from];
    const capturedPiece = board[move.to];

    move.capturedPiece = capturedPiece;
    move.enPassantSquare = enPassantSquare;
    move.castlingRights = castlingRights;
    move.halfMoveClock = halfMoveClock;
    move.kingSquare = { ...kingSquare };

    // Update en passant square
    enPassantSquare = null;

    // Handle special move types
    if (Math.abs(piece) === PAWN) {
      halfMoveClock = 0;
      const direction = sideToMove === WHITE ? -16 : 16;
      if (move.to - move.from === 2 * direction) {
        enPassantSquare = move.from + direction;
      }
    } else if (move.isEnPassant) {
      const captureSquare = sideToMove === WHITE ? move.to + 16 : move.to - 16;
      board[captureSquare] = null;
      move.capturedPiece = board[captureSquare];
    } else if (move.isCastling) {
      if (move.to > move.from) {
        // King-side castling
        const rookFrom = move.to + 1;
        const rookTo = move.to - 1;
        board[rookTo] = board[rookFrom];
        board[rookFrom] = null;
      } else {
        // Queen-side castling
        const rookFrom = move.to - 2;
        const rookTo = move.to + 1;
        board[rookTo] = board[rookFrom];
        board[rookFrom] = null;
      }
    }

    // Move the piece
    board[move.to] = move.promotion ? (sideToMove === WHITE ? move.promotion : -move.promotion) : piece;
    board[move.from] = null;

    // Update king's position
    if (Math.abs(piece) === KING) {
      kingSquare[sideToMove] = move.to;
    }

    // Update castling rights
    castlingRights &= updateCastlingRights(move.from);
    castlingRights &= updateCastlingRights(move.to);

    // Update half move clock
    if (capturedPiece !== null || Math.abs(piece) === PAWN) {
      halfMoveClock = 0;
    } else {
      halfMoveClock++;
    }

    // Update full move number
    if (sideToMove === BLACK) {
      fullMoveNumber++;
    }

    // Push move to stack
    moveStack.push(move);

    // Switch side
    sideToMove ^= 1;
  }

  function undoMove() {
    const move = moveStack.pop();

    // Switch side back
    sideToMove ^= 1;

    // Restore board state
    board[move.from] = board[move.to];
    if (move.promotion) {
      board[move.from] = sideToMove === WHITE ? PAWN : -PAWN;
    }
    board[move.to] = move.capturedPiece;

    // Restore en passant square, castling rights, half move clock, and king's position
    enPassantSquare = move.enPassantSquare;
    castlingRights = move.castlingRights;
    halfMoveClock = move.halfMoveClock;
    kingSquare = move.kingSquare;

    // Handle en passant capture
    if (move.isEnPassant) {
      const captureSquare = sideToMove === WHITE ? move.to + 16 : move.to - 16;
      board[captureSquare] = sideToMove === WHITE ? -PAWN : PAWN;
      board[move.to] = null;
    }

    // Handle castling
    if (move.isCastling) {
      if (move.to > move.from) {
        // King-side castling
        const rookFrom = move.to + 1;
        const rookTo = move.to - 1;
        board[rookFrom] = board[rookTo];
        board[rookTo] = null;
      } else {
        // Queen-side castling
        const rookFrom = move.to - 2;
        const rookTo = move.to + 1;
        board[rookFrom] = board[rookTo];
        board[rookTo] = null;
      }
    }
  }

  function updateCastlingRights(square) {
    const castlingRightsMask = 15;
    switch (square) {
      case SQUARES.e1:
        return castlingRightsMask ^ 3; // Remove KQ castling rights
      case SQUARES.e8:
        return castlingRightsMask ^ 12; // Remove kq castling rights
      case SQUARES.a1:
        return castlingRightsMask ^ 2; // Remove Q castling right
      case SQUARES.h1:
        return castlingRightsMask ^ 1; // Remove K castling right
      case SQUARES.a8:
        return castlingRightsMask ^ 8; // Remove q castling right
      case SQUARES.h8:
        return castlingRightsMask ^ 4; // Remove k castling right
      default:
        return castlingRightsMask;
    }
  }

  /****************************\
   ============================
   
           MOVE VALIDATION

   ============================              
  \****************************/

  function isKingAttacked(side) {
    return isSquareAttacked(kingSquare[side], side ^ 1);
  }

  function isSquareAttacked(square, attackerSide) {
    // Pawns
    const pawnDirection = attackerSide === WHITE ? -16 : 16;
    const pawnAttacks = [pawnDirection - 1, pawnDirection + 1];
    for (let offset of pawnAttacks) {
      const toSquare = square + offset;
      if ((toSquare & 0x88) !== 0) continue;
      const piece = board[toSquare];
      if (piece === null) continue;
      if (piece === (attackerSide === WHITE ? PAWN : -PAWN)) {
        return true;
      }
    }

    // Knights
    for (let offset of DIRECTIONS.KNIGHT) {
      const toSquare = square + offset;
      if ((toSquare & 0x88) !== 0) continue;
      const piece = board[toSquare];
      if (piece === null) continue;
      if (piece === (attackerSide === WHITE ? KNIGHT : -KNIGHT)) {
        return true;
      }
    }

    // Bishops, Queens
    for (let offset of DIRECTIONS.BISHOP) {
      let toSquare = square;
      while (true) {
        toSquare += offset;
        if ((toSquare & 0x88) !== 0) break;
        const piece = board[toSquare];
        if (piece === null) continue;
        if (Math.sign(piece) !== (attackerSide === WHITE ? 1 : -1)) break;
        if (piece === (attackerSide === WHITE ? BISHOP : -BISHOP) ||
            piece === (attackerSide === WHITE ? QUEEN : -QUEEN)) {
          return true;
        }
        break;
      }
    }

    // Rooks, Queens
    for (let offset of DIRECTIONS.ROOK) {
      let toSquare = square;
      while (true) {
        toSquare += offset;
        if ((toSquare & 0x88) !== 0) break;
        const piece = board[toSquare];
        if (piece === null) continue;
        if (Math.sign(piece) !== (attackerSide === WHITE ? 1 : -1)) break;
        if (piece === (attackerSide === WHITE ? ROOK : -ROOK) ||
            piece === (attackerSide === WHITE ? QUEEN : -QUEEN)) {
          return true;
        }
        break;
      }
    }

    // King
    for (let offset of DIRECTIONS.KING) {
      const toSquare = square + offset;
      if ((toSquare & 0x88) !== 0) continue;
      const piece = board[toSquare];
      if (piece === null) continue;
      if (piece === (attackerSide === WHITE ? KING : -KING)) {
        return true;
      }
    }

    return false;
  }

  /****************************\
   ============================
   
            EVALUATION

   ============================              
  \****************************/

  const PIECE_VALUES = {
    [PAWN]: 100,
    [KNIGHT]: 320,
    [BISHOP]: 330,
    [ROOK]: 500,
    [QUEEN]: 900,
    [KING]: 20000
  };

  function evaluate() {
    let score = 0;
    for (let square = 0; square < 128; square++) {
      if ((square & 0x88) !== 0) continue;
      const piece = board[square];
      if (piece === null) continue;
      const pieceValue = PIECE_VALUES[Math.abs(piece)];
      score += pieceValue * Math.sign(piece);
    }
    return (sideToMove === WHITE) ? score : -score;
  }

  /****************************\
   ============================
   
             SEARCH

   ============================              
  \****************************/

  function searchPosition(depth, pvCount = PV_COUNT) {
    nodes = 0;
    const bestMoves = [];
  
    // Only search at the maximum depth
    for (let pvIndex = 0; pvIndex < pvCount; pvIndex++) {
      const excludeMoves = bestMoves.map(info => info.move);
      const result = negamax(-INFINITY, INFINITY, depth, excludeMoves);
      if (result.move !== null) {
        const attributes = getMoveAttributes(result.move);
        bestMoves.push({
          move: result.move,
          score: result.score,
          depth: depth,
          attributes: attributes
        });
      }
    }
  
    return bestMoves;
  }
  

  function negamax(alpha, beta, depth, excludeMoves = []) {
    nodes++;
  
    if (depth === 0) {
      return { score: evaluate(), move: null };
    }
  
    const alphaOrig = alpha;
  
    const hashKey = generateHashKey();
    if (transpositionTable[hashKey] && transpositionTable[hashKey].depth >= depth) {
      const ttEntry = transpositionTable[hashKey];
      if (ttEntry.flag === 'EXACT') {
        return { score: ttEntry.score, move: ttEntry.bestMove };
      } else if (ttEntry.flag === 'LOWERBOUND') {
        alpha = Math.max(alpha, ttEntry.score);
      } else if (ttEntry.flag === 'UPPERBOUND') {
        beta = Math.min(beta, ttEntry.score);
      }
      if (alpha >= beta) {
        return { score: ttEntry.score, move: ttEntry.bestMove };
      }
    }
  
    // Change from 'const' to 'let' to allow reassignment
    let moves = generateLegalMoves();
  
    // Exclude previously found best moves
    moves = moves.filter(move => !excludeMoves.some(exMove => areMovesEqual(move, exMove)));
  
    // Sort moves for better move ordering
    moves.sort((a, b) => moveOrdering(a) - moveOrdering(b));
  
    let bestScore = -INFINITY;
    let bestMove = null;
  
    for (let move of moves) {
      makeMove(move);
      const result = negamax(-beta, -alpha, depth - 1);
      const score = -result.score;
      undoMove();
  
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
      if (alpha >= beta) {
        break;
      }
    }
  
    let flag = 'EXACT';
    if (bestScore <= alphaOrig) flag = 'UPPERBOUND';
    else if (bestScore >= beta) flag = 'LOWERBOUND';
  
    // Store in transposition table
    transpositionTable[hashKey] = {
      score: bestScore,
      depth: depth,
      flag: flag,
      bestMove: bestMove
    };
  
    return { score: bestScore, move: bestMove };
  }
  

  function moveOrdering(move) {
    // Prefer captures and promotions
    const capturingPiece = board[move.from];
    const capturedPiece = move.capturedPiece || board[move.to];
    let score = 0;
    if (capturedPiece !== null) {
      score += 10 * PIECE_VALUES[Math.abs(capturedPiece)] - PIECE_VALUES[Math.abs(capturingPiece)];
    }
    if (move.promotion) {
      score += PIECE_VALUES[move.promotion];
    }
    return -score; // Negative because we want higher scores first
  }

  function areMovesEqual(move1, move2) {
    return move1.from === move2.from && move1.to === move2.to && move1.promotion === move2.promotion;
  }

  function generateHashKey() {
    // Simple hash function
    let key = '';
    for (let i = 0; i < 128; i++) {
      if ((i & 0x88) !== 0) continue;
      const piece = board[i];
      key += (piece !== null ? piece : '0');
    }
    key += sideToMove;
    key += castlingRights;
    key += enPassantSquare;
    return key;
  }

  /****************************\
   ============================
   
          MOVE ATTRIBUTES

   ============================              
  \****************************/

  function getMoveAttributes(move) {
    const attributes = [];

    // Make the move
    makeMove(move);

    // Analyze the move
    if (createsFork(move)) {
      attributes.push('Creates a fork');
    }
    if (createsPin(move)) {
      attributes.push('Creates a pin');
    }
    if (controlsCenter(move)) {
      attributes.push('Controls the center');
    }
    if (developsPiece(move)) {
      attributes.push('Develops a piece');
    }
    if (improvesKingSafety(move)) {
      attributes.push('Improves king safety');
    }
    if (threatensMate(move)) {
      attributes.push('Threatens checkmate');
    }
    if (capturesValuablePiece(move)) {
      attributes.push('Captures a valuable piece');
    }

    // Limit to between one and four attributes
    if (attributes.length < 1) {
      attributes.push('Improves position');
    } else if (attributes.length > 4) {
      attributes.splice(4);
    }

    // Undo the move
    undoMove();

    return attributes;
  }

  // Tactical motif functions
  function createsFork(move) {
    const piece = board[move.to];
    const attacks = getAttackedSquares(move.to, piece);
    let targets = 0;
    for (let sq of attacks) {
      const targetPiece = board[sq];
      if (targetPiece !== null && Math.sign(targetPiece) !== Math.sign(piece) && Math.abs(targetPiece) > PAWN) {
        targets++;
      }
    }
    return targets >= 2;
  }

  function createsPin(move) {
    // Simplified pin detection
    // After the move, check if any opponent piece is pinned
    // This requires more complex logic, we'll use a simple approximation
    return false; // Placeholder
  }

  function controlsCenter(move) {
    const centerSquares = [SQUARES.d4, SQUARES.d5, SQUARES.e4, SQUARES.e5];
    return centerSquares.includes(move.to);
  }

  function developsPiece(move) {
    const piece = board[move.to];
    const startingRanks = sideToMove === WHITE ? [6, 7] : [0, 1];
    const fromRank = move.from >> 4;
    return startingRanks.includes(fromRank) && Math.abs(piece) !== PAWN;
  }

  function improvesKingSafety(move) {
    // Simplified king safety improvement detection
    // For example, castling improves king safety
    return move.isCastling;
  }

  function threatensMate(move) {
    // After making the move, check if there is a mate threat
    // Simplified for now
    return false; // Placeholder
  }

  function capturesValuablePiece(move) {
    const capturedPiece = move.capturedPiece || board[move.to];
    return capturedPiece !== null && Math.abs(capturedPiece) >= ROOK;
  }

  function getAttackedSquares(square, piece) {
    const pieceType = Math.abs(piece);
    let offsets = [];
    if (pieceType === PAWN) {
      const pawnDirection = sideToMove === WHITE ? -16 : 16;
      offsets = [pawnDirection - 1, pawnDirection + 1];
    } else if (pieceType === KNIGHT) {
      offsets = DIRECTIONS.KNIGHT;
    } else if (pieceType === BISHOP) {
      offsets = DIRECTIONS.BISHOP;
    } else if (pieceType === ROOK) {
      offsets = DIRECTIONS.ROOK;
    } else if (pieceType === QUEEN) {
      offsets = DIRECTIONS.QUEEN;
    } else if (pieceType === KING) {
      offsets = DIRECTIONS.KING;
    }

    const attackedSquares = [];
    const isSliding = [BISHOP, ROOK, QUEEN].includes(pieceType);

    for (let offset of offsets) {
      let toSquare = square;
      while (true) {
        toSquare += offset;
        if ((toSquare & 0x88) !== 0) break;
        attackedSquares.push(toSquare);
        if (board[toSquare] !== null) break;
        if (!isSliding) break;
      }
    }

    return attackedSquares;
  }

  /****************************\
   ============================
   
          PUBLIC API

   ============================              
  \****************************/

  return {
    setFEN: setFEN,
    searchPosition: searchPosition,
    getMoveAttributes: getMoveAttributes,
    initialize: initialize,
    generateLegalMoves: generateLegalMoves,
    makeMove: makeMove,
    undoMove: undoMove,
    evaluate: evaluate, 
    board: board,
    moveStack: moveStack,
    SQUARES: SQUARES,
    PIECE_SYMBOLS: { 0: '', 1: 'P', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K', '-1': 'p', '-2': 'n', '-3': 'b', '-4': 'r', '-5': 'q', '-6': 'k' },
    sideToMove: function() { return sideToMove; },
    printBoard: function() {
      let output = '';
      for (let rank = 0; rank < 8; rank++) {
        let line = '';
        for (let file = 0; file < 8; file++) {
          const square = rank * 16 + file;
          const piece = board[square];
          const symbol = this.PIECE_SYMBOLS[piece] || '.';
          line += ' ' + symbol;
        }
        output += line + '\n';
      }
      console.log(output);
    }
  };
};

// Usage example:

// Create an instance of the engine
// const engine = new Engine();

// // Initialize the engine
// engine.initialize();

// // Set the board position (FEN)
// const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
// engine.setFEN(fen);

// // Search for the top 3 moves
// const depth = 3; // Adjust the depth as needed
// const topMoves = engine.searchPosition(depth, 3);

// // Display the moves and attributes
// for (let moveInfo of topMoves) {
//   const move = moveInfo.move;
//   const from = Object.keys(engine.SQUARES).find(key => engine.SQUARES[key] === move.from);
//   const to = Object.keys(engine.SQUARES).find(key => engine.SQUARES[key] === move.to);
//   const promotion = move.promotion ? engine.PIECE_SYMBOLS[move.promotion] : '';
//   console.log(`Move: ${from}${to}${promotion}`);
//   console.log(`Score: ${moveInfo.score}`);
//   console.log(`Attributes: ${moveInfo.attributes.join(', ')}`);
// }
// Or, for ES6 modules
export default Engine;
