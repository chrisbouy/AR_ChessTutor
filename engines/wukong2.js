class Engine {
  constructor() {
    // Engine version
    this.VERSION = '2.0';
    this.ELO = '1920';

    // Sides to move
    this.WHITE = 0;
    this.BLACK = 1;

    // Piece types
    this.EMPTY = 0;
    this.PAWN = 1;
    this.KNIGHT = 2;
    this.BISHOP = 3;
    this.ROOK = 4;
    this.QUEEN = 5;
    this.KING = 6;
    this.moveGenerationCount = 0;
    // Piece codes
    this.PIECES = {
      'P': this.PAWN,
      'N': this.KNIGHT,
      'B': this.BISHOP,
      'R': this.ROOK,
      'Q': this.QUEEN,
      'K': this.KING,
      'p': -this.PAWN,
      'n': -this.KNIGHT,
      'b': -this.BISHOP,
      'r': -this.ROOK,
      'q': -this.QUEEN,
      'k': -this.KING
    };

    // Piece symbols for display
    this.PIECE_SYMBOLS = {
      [this.PAWN]: 'P',
      [this.KNIGHT]: 'N',
      [this.BISHOP]: 'B',
      [this.ROOK]: 'R',
      [this.QUEEN]: 'Q',
      [this.KING]: 'K',
      [-this.PAWN]: 'p',
      [-this.KNIGHT]: 'n',
      [-this.BISHOP]: 'b',
      [-this.ROOK]: 'r',
      [-this.QUEEN]: 'q',
      [-this.KING]: 'k',
      [null]: '.',
    };

    this.PIECE_VALUES = {
      [this.PAWN]: 100,
      [this.KNIGHT]: 320,
      [this.BISHOP]: 330,
      [this.ROOK]: 500,
      [this.QUEEN]: 900,
      [this.KING]: 20000
    };

    // Square constants using 0x88 mapping: A1=0, B1=1, ..., H1=7, A2=16, ..., H8=119
    this.SQUARES = {};
    this.FILES = 'abcdefgh';
    this.RANKS = '12345678';
    for (let rank = 1; rank <= 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = this.FILES[file] + rank;
        this.SQUARES[square] = (rank - 1) * 16 + file;
      }
    }

    this.DIRECTIONS = {
      PAWN: [[-16, -32, -17, -15], [16, 32, 17, 15]], // [WHITE, BLACK]
      KNIGHT: [-17, -15, -10, -6, 6, 10, 15, 17],
      BISHOP: [-9, -7, 7, 9],
      ROOK: [-16, -1, 1, 16],
      QUEEN: [-17, -16, -15, -1, 1, 15, 16, 17],
      KING: [-17, -16, -15, -1, 1, 15, 16, 17]
    };

    // Board representation using 0x88
    this.board = new Array(128).fill(null);
    this.sideToMove = this.WHITE;
    this.castlingRights = 0;
    this.enPassantSquare = null;
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.kingSquare = { [this.WHITE]: null, [this.BLACK]: null };

    // Move history
    this.moveStack = [];

    // Transposition table
    this.transpositionTable = {};

    // Search parameters
    this.nodes = 0;
    this.searchDepth = 3;
    this.timing = {
      timeSet: false,
      stopTime: null,
      stopped: false
    };

    // Constants for search
    this.MAX_DEPTH = 64;
    this.INFINITY = 100000;
    this.MATE_SCORE = 90000;
    this.MATE_THRESHOLD = 80000;

    // Multi-PV parameters
    this.PV_COUNT = 3;

    // Initialize the engine by resetting the board
    this.resetBoard();
  }

  // Initialize the engine
  initialize() {
    this.resetBoard();
  }

  // Reset the board to the initial position
  resetBoard() {
    const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.setFEN(initialFEN);
  }

  // Set the board position using FEN
  setFEN(fen) {
    const parts = fen.split(' ');
    const position = parts[0];
    const side = parts[1];
    const castling = parts[2];
    const enPassant = parts[3];
    const halfMove = parseInt(parts[4], 10);
    const fullMove = parseInt(parts[5], 10);

    // Clear board
    this.board = new Array(128).fill(null);

    // Set pieces
    let rank = 8; // FEN starts from rank 8
    let file = 0;

    for (let i = 0; i < position.length; i++) {
      const char = position[i];

      if (char === '/') {
        rank--;
        file = 0;
        continue;
      }

      if (char >= '1' && char <= '8') {
        file += parseInt(char, 10);
      } else {
        const piece = this.PIECES[char];
        const square = (rank - 1) * 16 + file;
        this.board[square] = piece;
        const squareName = this.getSquareName(square);
        // console.log(`Setting piece ${this.PIECE_SYMBOLS[piece]} on square ${square} (${squareName})`);
        
        if (piece === this.KING) {
          this.kingSquare[this.WHITE] = square;
        } else if (piece === -this.KING) {
          this.kingSquare[this.BLACK] = square;
        }
        file++;
      }
    }

    // Set side to move
    this.sideToMove = (side === 'w') ? this.WHITE : this.BLACK;

    // Set castling rights
    this.castlingRights = 0;
    if (castling.includes('K')) this.castlingRights |= 1;
    if (castling.includes('Q')) this.castlingRights |= 2;
    if (castling.includes('k')) this.castlingRights |= 4;
    if (castling.includes('q')) this.castlingRights |= 8;

    // Set en passant square
    this.enPassantSquare = (enPassant === '-') ? null : this.SQUARES[enPassant];

    // Set half move clock and full move number
    this.halfMoveClock = halfMove;
    this.fullMoveNumber = fullMove;

    // Clear move history and transposition table
    this.moveStack = [];
    this.transpositionTable = {};

    // Add logging to verify board state
    // console.log('Engine board after setFEN:');
    //this.printBoard();
    // console.log('Side to move:', this.sideToMove === this.WHITE ? 'WHITE' : 'BLACK');
  }
// Inside the Engine class

/**
 * Converts a square index to its algebraic notation (e.g., 0 -> A1).
 * @param {number} square - The square index (0 to 119).
 * @returns {string} - The algebraic notation of the square.
 */
getSquareName(square) {
  const file = square & 7; // 0 to 7
  const rank = (square >> 4) + 1; // 1 to 8
  if (rank < 1 || rank > 8 || file < 0 || file > 7) {
    return 'Invalid';
  }
  return `${this.FILES[file]}${rank}`;
}

  
  // Print the current board state
  printBoard() {
    let output = '';
    for (let rank = 8; rank >= 1; rank--) {
      let line = '';
      for (let file = 0; file < 8; file++) {
        const square = (rank - 1) * 16 + file;
        const piece = this.board[square];
        const symbol = this.PIECE_SYMBOLS[piece] || '.';
        line += ' ' + symbol;
      }
      output += line + '\n';
    }
    console.log(output);
  }

  // Generate all legal moves
  generateLegalMoves() {
    const moves = this.generatePseudoLegalMoves();
    const legalMoves = [];
    for (let move of moves) {
      this.makeMove(move);
      if (!this.isKingAttacked(this.sideToMove ^ 1)) {
        legalMoves.push(move);
      }
      this.undoMove();
    }
    // console.log(`Generated ${legalMoves.length} legal moves.`);
    return legalMoves;
  }

  // Generate all pseudo-legal moves (without considering checks)
  generatePseudoLegalMoves() {
    this.moveGenerationCount += 1;
    // console.log(`\nMove Generation Invocation #${this.moveGenerationCount}`);

    const moves = [];
    for (let square = 0; square < 128; square++) {
      if ((square & 0x88) !== 0) continue;
      const piece = this.board[square];
      if (piece === null || Math.sign(piece) !== (this.sideToMove === this.WHITE ? 1 : -1)) continue;
      const pieceOwner = Math.sign(piece) === 1 ? this.WHITE : this.BLACK;
      if (pieceOwner !== this.sideToMove) continue;
    
      const squareName = this.getSquareName(square);
      // console.log(`Square: ${square} (${squareName}), Piece: ${this.PIECE_SYMBOLS[piece]}`);
    
      const pieceType = Math.abs(piece);

      if (pieceType === this.PAWN) {
        this.generatePawnMoves(square, moves);
      } else if (pieceType === this.KNIGHT) {
        this.generatePieceMoves(square, this.DIRECTIONS.KNIGHT, false, moves);
      } else if (pieceType === this.BISHOP) {
        this.generatePieceMoves(square, this.DIRECTIONS.BISHOP, true, moves);
      } else if (pieceType === this.ROOK) {
        this.generatePieceMoves(square, this.DIRECTIONS.ROOK, true, moves);
      } else if (pieceType === this.QUEEN) {
        this.generatePieceMoves(square, this.DIRECTIONS.QUEEN, true, moves);
      } else if (pieceType === this.KING) {
        this.generatePieceMoves(square, this.DIRECTIONS.KING, false, moves);
        this.generateCastlingMoves(square, moves);
      }
    }
    // console.log(`Generated ${moves.length} pseudo-legal moves.`);
    return moves;
  }

  // Generate pawn moves
// Inside the Engine class

/**
 * Generates all pawn moves from a given square and adds them to the moves array.
 * @param {number} square - The current square of the pawn.
 * @param {Array} moves - The array to store generated moves.
 */
generatePawnMoves(square, moves) {
  const pawnDirection = this.sideToMove === this.WHITE ? 16 : -16;
  const captureOffsets = this.sideToMove === this.WHITE ? [15, 17] : [-17, -15];
  const startRank = this.sideToMove === this.WHITE ? 2 : 7;
  const promotionRank = this.sideToMove === this.WHITE ? 8 : 1;
  const currentRank = (square >> 4) + 1; // 1-based rank

  // console.log(`Generating pawn moves for pawn at ${this.getSquareName(square)} (Rank ${currentRank})`);

  // Single push
  let toSquare = square + pawnDirection;

  // console.log(`Pawn at ${this.getSquareName(square)} can move to ${this.getSquareName(toSquare)}`);

  if (this.board[toSquare] === null) {
    if (currentRank === promotionRank) {
      // Promotion
      moves.push(this.createMove(square, toSquare, this.QUEEN));
      moves.push(this.createMove(square, toSquare, this.ROOK));
      moves.push(this.createMove(square, toSquare, this.BISHOP));
      moves.push(this.createMove(square, toSquare, this.KNIGHT));
      console.log(`Pawn at ${this.getSquareName(square)} can promote to Queen, Rook, Bishop, or Knight at ${this.getSquareName(toSquare)}`);
    } else {
      moves.push(this.createMove(square, toSquare));
      // console.log(`Pawn at ${this.getSquareName(square)} can move to ${this.getSquareName(toSquare)}`);

      // Double push
      if (currentRank === startRank) {
        const doublePushSquare = toSquare + pawnDirection;
        if (this.board[doublePushSquare] === null) {
          moves.push(this.createMove(square, doublePushSquare));
          // console.log(`Pawn at ${this.getSquareName(square)} can double move to ${this.getSquareName(doublePushSquare)}`);
        }
      }
    }
  }

  // Captures
  for (let offset of captureOffsets) {
    toSquare = square + offset;
    if ((toSquare & 0x88) !== 0) continue;
    const targetPiece = this.board[toSquare];
    if (targetPiece !== null && Math.sign(targetPiece) !== Math.sign(this.board[square])) {
      if (currentRank === promotionRank) {
        // Promotion capture
        moves.push(this.createMove(square, toSquare, this.QUEEN));
        moves.push(this.createMove(square, toSquare, this.ROOK));
        moves.push(this.createMove(square, toSquare, this.BISHOP));
        moves.push(this.createMove(square, toSquare, this.KNIGHT));
        console.log(`Pawn at ${this.getSquareName(square)} can capture and promote at ${this.getSquareName(toSquare)}`);
      } else {
        moves.push(this.createMove(square, toSquare));
        // console.log(`Pawn at ${this.getSquareName(square)} can capture at ${this.getSquareName(toSquare)}`);
      }
    }
    // En passant
    if (toSquare === this.enPassantSquare) {
      moves.push(this.createMove(square, toSquare, null, true));
      console.log(`Pawn at ${this.getSquareName(square)} can capture en passant at ${this.getSquareName(toSquare)}`);
    }
  }
}


generatePieceMoves(square, offsets, isSliding, moves) {
  const piece = this.board[square];
  for (let offset of offsets) {
    let toSquare = square;
    while (true) {
      toSquare += offset;
      if ((toSquare & 0x88) !== 0) break; // Off board, stop for non-sliding or break out of loop if sliding
      const targetPiece = this.board[toSquare];
      // Debug
      // console.log(`Trying move from ${this.getSquareName(square)} to ${this.getSquareName(toSquare)} for ${this.PIECE_SYMBOLS[piece]}`);
      if (targetPiece === null) {
        moves.push(this.createMove(square, toSquare));
      } else {
        if (Math.sign(targetPiece) !== Math.sign(piece)) {
          moves.push(this.createMove(square, toSquare));
        }
        break;
      }
      if (!isSliding) break;
    }
  }
}


  // Generate castling moves
  generateCastlingMoves(square, moves) {
    if (this.isKingAttacked(this.sideToMove)) return;

    const kingSide = this.sideToMove === this.WHITE ? 1 : 4;
    const queenSide = this.sideToMove === this.WHITE ? 2 : 8;

    // King-side castling
    if ((this.castlingRights & kingSide) !== 0) {
      const emptySquares = this.sideToMove === this.WHITE ? [this.SQUARES.f1, this.SQUARES.g1] : [this.SQUARES.f8, this.SQUARES.g8];
      if (this.board[emptySquares[0]] === null && this.board[emptySquares[1]] === null) {
        if (!this.isSquareAttacked(emptySquares[0], this.sideToMove ^ 1) && !this.isSquareAttacked(emptySquares[1], this.sideToMove ^ 1)) {
          moves.push(this.createMove(square, emptySquares[1], null, false, true));
        }
      }
    }

    // Queen-side castling
    if ((this.castlingRights & queenSide) !== 0) {
      const emptySquares = this.sideToMove === this.WHITE ? [this.SQUARES.d1, this.SQUARES.c1, this.SQUARES.b1] : [this.SQUARES.d8, this.SQUARES.c8, this.SQUARES.b8];
      if (this.board[emptySquares[0]] === null && this.board[emptySquares[1]] === null && this.board[emptySquares[2]] === null) {
        if (!this.isSquareAttacked(emptySquares[0], this.sideToMove ^ 1) && !this.isSquareAttacked(emptySquares[1], this.sideToMove ^ 1)) {
          moves.push(this.createMove(square, emptySquares[1], null, false, true));
        }
      }
    }
  }

  // Create a move object
  createMove(from, to, promotion = null, isEnPassant = false, isCastling = false) {
    return {
      from: from,
      to: to,
      promotion: promotion,
      isEnPassant: isEnPassant,
      isCastling: isCastling,
      capturedPiece: null, // To be set when making the move
      enPassantSquare: this.enPassantSquare,
      castlingRights: this.castlingRights,
      halfMoveClock: this.halfMoveClock,
      kingSquare: { ...this.kingSquare }
    };
  }

  // Make a move on the board
  makeMove(move) {
    const piece = this.board[move.from];
    const capturedPiece = this.board[move.to];

    move.capturedPiece = capturedPiece;
    move.enPassantSquare = this.enPassantSquare;
    move.castlingRights = this.castlingRights;
    move.halfMoveClock = this.halfMoveClock;
    move.kingSquare = { ...this.kingSquare };

    // Update en passant square
    this.enPassantSquare = null;

    // Handle special move types
    if (Math.abs(piece) === this.PAWN) {
      this.halfMoveClock = 0;
      const direction = this.sideToMove === this.WHITE ? -16 : 16;
      if (move.to - move.from === 2 * direction) {
        this.enPassantSquare = move.from + direction;
      }
    } else if (move.isEnPassant) {
      const captureSquare = this.sideToMove === this.WHITE ? move.to + 16 : move.to - 16;
      this.board[captureSquare] = null;
      move.capturedPiece = this.sideToMove === this.WHITE ? -this.PAWN : this.PAWN;
    } else if (move.isCastling) {
      if (move.to > move.from) {
        // King-side castling
        const rookFrom = this.sideToMove === this.WHITE ? this.SQUARES.h1 : this.SQUARES.h8;
        const rookTo = this.sideToMove === this.WHITE ? this.SQUARES.f1 : this.SQUARES.f8;
        this.board[rookTo] = this.board[rookFrom];
        this.board[rookFrom] = null;
      } else {
        // Queen-side castling
        const rookFrom = this.sideToMove === this.WHITE ? this.SQUARES.a1 : this.SQUARES.a8;
        const rookTo = this.sideToMove === this.WHITE ? this.SQUARES.d1 : this.SQUARES.d8;
        this.board[rookTo] = this.board[rookFrom];
        this.board[rookFrom] = null;
      }
    }

    // Move the piece
    this.board[move.to] = move.promotion
      ? (this.sideToMove === this.WHITE ? move.promotion : -move.promotion)
      : piece;
    this.board[move.from] = null;

    // Update king's position
    if (Math.abs(piece) === this.KING) {
      this.kingSquare[this.sideToMove] = move.to;
    }

    // Update castling rights
    this.castlingRights &= this.updateCastlingRights(move.from);
    this.castlingRights &= this.updateCastlingRights(move.to);

    // Update half move clock
    if (capturedPiece !== null || Math.abs(piece) === this.PAWN) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }

    // Update full move number
    if (this.sideToMove === this.BLACK) {
      this.fullMoveNumber++;
    }

    // Push move to stack
    this.moveStack.push(move);

    // Switch side
    this.sideToMove ^= 1;
  }

  // Undo the last move
  undoMove() {
    const move = this.moveStack.pop();
    if (!move) return;

    // Switch side back
    this.sideToMove ^= 1;

    // Restore board state
    this.board[move.from] = this.board[move.to];
    if (move.promotion) {
      this.board[move.from] = this.sideToMove === this.WHITE ? this.PAWN : -this.PAWN;
    }
    this.board[move.to] = move.capturedPiece;

    // Restore en passant square, castling rights, half move clock, and king's position
    this.enPassantSquare = move.enPassantSquare;
    this.castlingRights = move.castlingRights;
    this.halfMoveClock = move.halfMoveClock;
    this.kingSquare = move.kingSquare;

    // Handle en passant capture
    if (move.isEnPassant) {
      const captureSquare = this.sideToMove === this.WHITE ? move.to + 16 : move.to - 16;
      this.board[captureSquare] = this.sideToMove === this.WHITE ? -this.PAWN : this.PAWN;
      this.board[move.to] = null;
    }

    // Handle castling
    if (move.isCastling) {
      if (move.to > move.from) {
        // King-side castling
        const rookFrom = this.sideToMove === this.WHITE ? this.SQUARES.h1 : this.SQUARES.h8;
        const rookTo = this.sideToMove === this.WHITE ? this.SQUARES.f1 : this.SQUARES.f8;
        this.board[rookFrom] = this.board[rookTo];
        this.board[rookTo] = null;
      } else {
        // Queen-side castling
        const rookFrom = this.sideToMove === this.WHITE ? this.SQUARES.a1 : this.SQUARES.a8;
        const rookTo = this.sideToMove === this.WHITE ? this.SQUARES.d1 : this.SQUARES.d8;
        this.board[rookFrom] = this.board[rookTo];
        this.board[rookTo] = null;
      }
    }
  }

  // Update castling rights based on the square
  updateCastlingRights(square) {
    const castlingRightsMask = 15;
    switch (square) {
      case this.SQUARES.e1:
        return castlingRightsMask ^ 3; // Remove KQ castling rights
      case this.SQUARES.e8:
        return castlingRightsMask ^ 12; // Remove kq castling rights
      case this.SQUARES.a1:
        return castlingRightsMask ^ 2; // Remove Q castling right
      case this.SQUARES.h1:
        return castlingRightsMask ^ 1; // Remove K castling right
      case this.SQUARES.a8:
        return castlingRightsMask ^ 8; // Remove q castling right
      case this.SQUARES.h8:
        return castlingRightsMask ^ 4; // Remove k castling right
      default:
        return this.castlingRights;
    }
  }

  // Check if the king of the given side is attacked
  isKingAttacked(side) {
    return this.isSquareAttacked(this.kingSquare[side], side ^ 1);
  }

  // Check if a square is attacked by the opponent
// Inside the Engine class

/**
 * Checks if a specific square is attacked by the opponent.
 * @param {number} square - The square to check for attacks.
 * @param {number} attackerSide - The side of the attacker (WHITE or BLACK).
 * @returns {boolean} - True if the square is attacked, else False.
 */
isSquareAttacked(square, attackerSide) {
  // Pawns
  const pawnAttacks = attackerSide === this.WHITE ? [square + 15, square + 17] : [square - 17, square - 15];
  for (let sq of pawnAttacks) {
    if ((sq & 0x88) !== 0) continue;
    const piece = this.board[sq];
    if (piece === (attackerSide === this.WHITE ? this.PAWN : -this.PAWN)) {
      return true;
    }
  }

  // Knights
  for (let offset of this.DIRECTIONS.KNIGHT) {
    const toSquare = square + offset;
    if ((toSquare & 0x88) !== 0) continue;
    const piece = this.board[toSquare];
    if (piece === (attackerSide === this.WHITE ? this.KNIGHT : -this.KNIGHT)) {
      return true;
    }
  }

  // Bishops and Queens
  for (let offset of this.DIRECTIONS.BISHOP) {
    let toSquare = square;
    while (true) {
      toSquare += offset;
      if ((toSquare & 0x88) !== 0) break;
      const piece = this.board[toSquare];
      if (piece === null) continue;
      if (Math.sign(piece) !== (attackerSide === this.WHITE ? 1 : -1)) break;
      if (piece === (attackerSide === this.WHITE ? this.BISHOP : -this.BISHOP) ||
          piece === (attackerSide === this.WHITE ? this.QUEEN : -this.QUEEN)) {
        return true;
      }
      break;
    }
  }

  // Rooks and Queens
  for (let offset of this.DIRECTIONS.ROOK) {
    let toSquare = square;
    while (true) {
      toSquare += offset;
      if ((toSquare & 0x88) !== 0) break;
      const piece = this.board[toSquare];
      if (piece === null) continue;
      if (Math.sign(piece) !== (attackerSide === this.WHITE ? 1 : -1)) break;
      if (piece === (attackerSide === this.WHITE ? this.ROOK : -this.ROOK) ||
          piece === (attackerSide === this.WHITE ? this.QUEEN : -this.QUEEN)) {
        return true;
      }
      break;
    }
  }

  // King
  for (let offset of this.DIRECTIONS.KING) {
    const toSquare = square + offset;
    if ((toSquare & 0x88) !== 0) continue;
    const piece = this.board[toSquare];
    if (piece === (attackerSide === this.WHITE ? this.KING : -this.KING)) {
      return true;
    }
  }

  return false;
}


  // Evaluate the board position
  evaluate() {
    let score = 0;
    for (let square = 0; square < 128; square++) {
      if ((square & 0x88) !== 0) continue;
      const piece = this.board[square];
      if (piece === null) continue;
      const pieceValue = this.PIECE_VALUES[Math.abs(piece)];
      let positionalBonus = 0;

      // Add positional bonuses
      if (Math.abs(piece) === this.KNIGHT || Math.abs(piece) === this.BISHOP) {
        // Knights and bishops are better towards the center
        const rank = (square >> 4) + 1; // 1-based rank
        const file = square & 7;
        positionalBonus += this.centerManhattanDistance(file, rank);
      }

      if (Math.abs(piece) === this.PAWN) {
        // Pawns are better when advanced
        const rank = (square >> 4) + 1; // 1-based rank
        positionalBonus += this.sideToMove === this.WHITE ? (rank - 2) : (7 - rank);
      }

      // Adjust score
      score += (pieceValue + positionalBonus) * Math.sign(piece);
    }

    // King safety, control of center, etc., can be added similarly

    return (this.sideToMove === this.WHITE) ? score : -score;
  }

  // Calculate Manhattan distance from the center
  centerManhattanDistance(file, rank) {
    // Distance from the center squares (d4, d5, e4, e5)
    const centerFiles = [3, 4];
    const centerRanks = [4, 5];

    let minDistance = Infinity;
    for (let cf of centerFiles) {
      for (let cr of centerRanks) {
        const distance = Math.abs(cf - file) + Math.abs(cr - rank);
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }
    // We want a higher score for being closer to the center
    return (4 - minDistance) * 10; // Adjust the multiplier as needed
  }

  // Search for the best move using Negamax with Alpha-Beta Pruning
  searchPosition(depth, pvCount = 1) {
    this.nodes = 0;
    const result = this.negamax(-this.INFINITY, this.INFINITY, depth);
    // console.log('Result from negamax:', result);

    if (result.move !== null) {
      // console.log('not null');
      return [{
        move: result.move,
        score: result.score,
        depth: depth,
        attributes: this.getMoveAttributes(result.move)
      }];
    }
    return [];
  }
  convertMoveToUCI(move) {
    if (!move || !move.from || !move.to) return 'Invalid Move';
  
    const file = (square) => String.fromCharCode((square % 8) + 97); // a-h
    const rank = (square) => Math.floor(square / 8) + 1; // 1-8
  
    const fromSquare = `${file(move.from)}${rank(move.from)}`;
    const toSquare = `${file(move.to)}${rank(move.to)}`;
  
    return `${fromSquare}${toSquare}`;
  }
  // Negamax search algorithm with Alpha-Beta pruning and Transposition Table
  negamax(alpha, beta, depth, excludeMoves = []) {
    // console.log(`Entering negamax with depth: ${depth}`);
        this.nodes++;

    if (depth === 0) {
      const evalScore = this.evaluate();
      // console.log(`Base case reached at depth 0 with score: ${evalScore}`);
  
      return { score: this.evaluate(), move: null };
    }

    const alphaOrig = alpha;

    const hashKey = this.generateHashKey();
    if (this.transpositionTable[hashKey] && this.transpositionTable[hashKey].depth >= depth) {
      const ttEntry = this.transpositionTable[hashKey];
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

    let moves = this.generateLegalMoves();

    // Exclude previously found best moves
    moves = moves.filter(move => !excludeMoves.some(exMove => this.areMovesEqual(move, exMove)));

    // Sort moves for better move ordering
    moves.sort((a, b) => this.moveOrdering(a) - this.moveOrdering(b));

    let bestScore = -this.INFINITY;
    let bestMove = null;

    for (let move of moves) {
      this.makeMove(move);
      const result = this.negamax(-beta, -alpha, depth - 1);
      const score = -result.score;
      this.undoMove();

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
    this.transpositionTable[hashKey] = {
      score: bestScore,
      depth: depth,
      flag: flag,
      bestMove: bestMove
    };
    // console.log(`Exiting negamax with bestScore: ${bestScore}, bestMove: ${this.convertMoveToUCI(bestMove)}`);

    return { score: bestScore, move: bestMove };
  }
 
  // Move ordering heuristic
  moveOrdering(move) {
    let score = 0;

    // Prefer captures and promotions
    const capturingPiece = this.board[move.from];
    const capturedPiece = move.capturedPiece || this.board[move.to];
    if (capturedPiece !== null) {
      score += 10 * this.PIECE_VALUES[Math.abs(capturedPiece)] - this.PIECE_VALUES[Math.abs(capturingPiece)];
    }
    if (move.promotion) {
      score += this.PIECE_VALUES[move.promotion];
    }

    // Prefer center control
    if (this.controlsCenter(move)) {
      score += 50;
    }

    // Penalize knight moves to the rim
    const piece = this.board[move.from];
    if (Math.abs(piece) === this.KNIGHT) {
      const toFile = move.to & 7;
      if (toFile === 0 || toFile === 7) {
        score -= 50; // Adjust penalty as needed
      }
    }

    // Prefer developing moves
    if (this.developsPiece(move)) {
      score += 30;
    }

    // Prefer moves that improve king safety
    if (this.improvesKingSafety(move)) {
      score += 20;
    }

    return -score; // Negative because we want higher scores first
  }
// Inside the Engine class
 
/**
 * Checks if a move controls the center squares (d4, d5, e4, e5).
 * @param {Object} move - The move object containing 'to' square.
 * @returns {boolean} - True if the move targets a center square, else false.
 */
controlsCenter(move) {
  const centerSquares = [
    this.SQUARES.d4,
    this.SQUARES.d5,
    this.SQUARES.e4,
    this.SQUARES.e5
  ];
  return centerSquares.includes(move.to);
}
/**
 * Checks if a move develops a piece.
 * Typically, this means moving a piece from its initial position towards the center or into an active position.
 * @param {Object} move - The move object containing 'from' and 'to' squares.
 * @returns {boolean} - True if the move develops a piece, else false.
 */
developsPiece(move) {
  const piece = this.board[move.from];
  const pieceType = Math.abs(piece);
  
  // Define initial positions for pieces that can develop
  const initialPositions = {
    [this.WHITE]: {
      [this.KNIGHT]: [this.SQUARES.b1, this.SQUARES.g1],
      [this.BISHOP]: [this.SQUARES.c1, this.SQUARES.f1],
      [this.ROOK]: [this.SQUARES.a1, this.SQUARES.h1],
      [this.QUEEN]: [this.SQUARES.d1]
    },
    [this.BLACK]: {
      [this.KNIGHT]: [this.SQUARES.b8, this.SQUARES.g8],
      [this.BISHOP]: [this.SQUARES.c8, this.SQUARES.f8],
      [this.ROOK]: [this.SQUARES.a8, this.SQUARES.h8],
      [this.QUEEN]: [this.SQUARES.d8]
    }
  };
  
  // Check if the piece type has initial positions defined
  if (
    initialPositions[this.sideToMove] &&
    initialPositions[this.sideToMove][pieceType] &&
    initialPositions[this.sideToMove][pieceType].includes(move.from)
  ) {
    // Option 1: Check if the move targets a central square
    const centralSquares = [this.SQUARES.d4, this.SQUARES.d5, this.SQUARES.e4, this.SQUARES.e5];
    if (centralSquares.includes(move.to)) {
      return true;
    }
    
    // Option 2: Any move from the initial position is considered development
    // Uncomment the following line if you prefer this criterion
    // return true;
  }
  
  return false;
}

/**
 * Checks if a move improves the king's safety.
 * Typically includes castling or moving a piece to defend the king.
 * @param {Object} move - The move object containing 'from', 'to', and flags like 'isCastling'.
 * @returns {boolean} - True if the move improves king safety, else false.
 */
improvesKingSafety(move) {
  // Check if the move is castling
  if (move.isCastling) {
    return true;
  }
  
  const piece = this.board[move.to];
  const pieceType = Math.abs(piece);
  
  // Define defensive squares around the king
  const kingSquare = this.kingSquare[this.sideToMove];
  const defensiveSquares = [
    kingSquare - 1, kingSquare + 1,      // Left and Right
    kingSquare - 16, kingSquare + 16,    // Up and Down
    kingSquare - 17, kingSquare - 15,    // Diagonals
    kingSquare + 17, kingSquare + 15
  ];
  
  // If the move brings a piece to a defensive square, it improves king safety
  if (defensiveSquares.includes(move.to)) {
    return true;
  }
  
  // Additional Criteria (Optional):
  // - Moving a piece closer to the king (reducing distance)
  // - Blocking potential attacks
  // Implement more sophisticated checks as needed
  
  return false;
}

/**
 * Calculates the Manhattan distance between two squares.
 * @param {number} square1 - The first square index.
 * @param {number} square2 - The second square index.
 * @returns {number} - The Manhattan distance between the squares.
 */
calculateManhattanDistance(square1, square2) {
  const file1 = square1 & 7;
  const rank1 = (square1 >> 4);
  const file2 = square2 & 7;
  const rank2 = (square2 >> 4);
  
  return Math.abs(file1 - file2) + Math.abs(rank1 - rank2);
}

  // Check if two moves are equal
  areMovesEqual(move1, move2) {
    return move1.from === move2.from && move1.to === move2.to && move1.promotion === move2.promotion;
  }

  // Generate a simple hash key for the current position
  generateHashKey() {
    // Simple hash function
    let key = '';
    for (let i = 0; i < 128; i++) {
      if ((i & 0x88) !== 0) continue;
      const piece = this.board[i];
      key += (piece !== null ? piece : '0');
    }
    key += this.sideToMove;
    key += this.castlingRights;
    key += this.enPassantSquare;
    return key;
  }

  // Get move attributes based on tactical motifs
  getMoveAttributes(move) {
    const attributes = [];

    // Make the move
    this.makeMove(move);

    // Analyze the move
    if (this.createsFork(move)) {
      attributes.push('Creates a fork');
    }
    if (this.createsPin(move)) {
      attributes.push('Creates a pin');
    }
    if (this.controlsCenter(move)) {
      attributes.push('Controls the center');
    }
    if (this.developsPiece(move)) {
      attributes.push('Develops a piece');
    }
    if (this.improvesKingSafety(move)) {
      attributes.push('Improves king safety');
    }
    if (this.threatensMate(move)) {
      attributes.push('Threatens checkmate');
    }
    if (this.capturesValuablePiece(move)) {
      attributes.push('Captures a valuable piece');
    }

    // Limit to between one and four attributes
    if (attributes.length < 1) {
      attributes.push('Improves position');
    } else if (attributes.length > 4) {
      attributes.splice(4);
    }

    // Undo the move
    this.undoMove();

    return attributes;
  }

  // Tactical motif functions

  // Check if the move creates a fork
  createsFork(move) {
    const piece = this.board[move.to];
    const attacks = this.getAttackedSquares(move.to, piece);
    let targets = 0;
    for (let sq of attacks) {
      const targetPiece = this.board[sq];
      if (targetPiece !== null && Math.sign(targetPiece) !== Math.sign(piece) && Math.abs(targetPiece) > this.PAWN) {
        targets++;
      }
    }
    return targets >= 2;
  }

  createsPin(move) {
    // We'll do a very simplified approximation:
    // 1. Make the move.
    this.makeMove(move);
  
    // 2. Identify if after this move, removing the moved piece would expose the king.
    // Actually, let's just check if before the move, the piece was aligned with the king and a potential enemy slider.
  
    // Undo the move and try a more direct approach:
    this.undoMove();
  
    // Approach:
    // - The idea: A pin is usually detected before we move the piece. If the piece currently on 'from' square moves,
    //   would that expose the king to an attack from a rook/bishop/queen line?
    // To do that:
    // 1. Identify our king square.
    const kingSq = this.kingSquare[this.sideToMove]; 
  
    // 2. Check all sliding directions (for rook, bishop, queen) from king to see if 
    //    the piece at 'from' was along that line blocking an enemy attack.
    const directionsToCheck = this.DIRECTIONS.ROOK.concat(this.DIRECTIONS.BISHOP);
    let isPinned = false;
  
    // If the piece moved was not on the same line with the king and a potential attacker, it can't be a pin.
    // Check lines from king to 'from' square:
    const deltaFile = ((move.from & 7) - (kingSq & 7));
    const deltaRank = ((move.from >> 4) - (kingSq >> 4));
  
    // If piece is not aligned with king (straight or diagonal), not pinned
    let aligned = false;
    if (deltaFile === 0 || deltaRank === 0 || Math.abs(deltaFile) === Math.abs(deltaRank)) aligned = true;
  
    if (!aligned) return false;
  
    // Now, simulate the piece being gone: temporarily remove it and check if king is attacked
    const savedPiece = this.board[move.from];
    this.board[move.from] = null; // Temporarily remove piece
    const wasAttacked = this.isSquareAttacked(kingSq, this.sideToMove ^ 1);
    this.board[move.from] = savedPiece; // restore piece
  
    if (wasAttacked) {
      isPinned = true;
    }
  
    return isPinned;
  }

  threatensMate(move) {
    // Make the move
    this.makeMove(move);
  
    // Now check if the opponent is in check and has no moves
    const oppSide = this.sideToMove; // After makeMove, sideToMove has switched
    const kingSq = this.kingSquare[oppSide];
  
    const inCheck = this.isSquareAttacked(kingSq, oppSide ^ 1);
    let isMate = false;
    if (inCheck) {
      const oppMoves = this.generateLegalMoves();
      if (oppMoves.length === 0) {
        // It's checkmate
        isMate = true;
      }
    }
  
    // Undo the move
    this.undoMove();
  
    return isMate;
  }
  

  // Check if the move captures a valuable piece
  capturesValuablePiece(move) {
    const capturedPiece = move.capturedPiece || this.board[move.to];
    return capturedPiece !== null && Math.abs(capturedPiece) >= this.ROOK;
  }

  // Get squares attacked by a piece on a given square
  getAttackedSquares(square, piece) {
    const pieceType = Math.abs(piece);
    let offsets = [];
    if (pieceType === this.PAWN) {
      const pawnDirection = this.sideToMove === this.WHITE ? -16 : 16;
      offsets = this.sideToMove === this.WHITE ? [pawnDirection - 1, pawnDirection + 1] : [pawnDirection - 1, pawnDirection + 1];
    } else if (pieceType === this.KNIGHT) {
      offsets = this.DIRECTIONS.KNIGHT;
    } else if (pieceType === this.BISHOP) {
      offsets = this.DIRECTIONS.BISHOP;
    } else if (pieceType === this.ROOK) {
      offsets = this.DIRECTIONS.ROOK;
    } else if (pieceType === this.QUEEN) {
      offsets = this.DIRECTIONS.QUEEN;
    } else if (pieceType === this.KING) {
      offsets = this.DIRECTIONS.KING;
    }

    const attackedSquares = [];
    const isSliding = [this.BISHOP, this.ROOK, this.QUEEN].includes(pieceType);

    for (let offset of offsets) {
      let toSquare = square;
      while (true) {
        toSquare += offset;
        if ((toSquare & 0x88) !== 0) break;
        attackedSquares.push(toSquare);
        if (this.board[toSquare] !== null) break;
        if (!isSliding) break;
      }
    }

    return attackedSquares;
  }

  // Select a random move (for fallback)
  selectRandomMove() {
    const possibleMoves = this.generateLegalMoves();
    if (possibleMoves.length === 0) {
      console.log('No legal moves available.');
      return null;
    }
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }
  getPieceName(pieceSymbol) {
    const pieceNames = {
        p: 'Pawn',
        n: 'Knight',
        b: 'Bishop',
        r: 'Rook',
        q: 'Queen',
        k: 'King'
    };
    return pieceNames[pieceSymbol.toLowerCase()] || 'Piece';
}
  // Make a random move (fallback)
  makeRandomMove() {
    const move = this.selectRandomMove();
    if (move) {
      this.makeMove(move);
      return move;
    }
    return null;
  }
}

export default Engine;
