// Tutoring.js

class Tutoring {
    constructor(skillLevel = 'beginner') {
      this.skillLevel = skillLevel; // Set the default skill level
    }
  
    setSkillLevel(skillLevel) {
      this.skillLevel = skillLevel;
    }
  
    analyzeMove(move, chess) {
      // Provide feedback based on the skill level
      switch (this.skillLevel) {
        case 'beginner':
          return this.basicAnalysis(move, chess);
        case 'intermediate':
          return this.intermediateAnalysis(move, chess);
        case 'advanced':
          return this.advancedAnalysis(move, chess);
        default:
          return "No feedback available.";
      }
    }
  
    basicAnalysis(move, chess) {
      // Beginner level feedback, simple and encouraging
      let feedback = '';
  
      if (move.captured) {
        feedback += `Good job! You captured a ${move.captured}. `;
      } else {
        feedback += `Consider controlling the center of the board. `;
      }
  
      if (chess.in_check()) {
        feedback += "Great! You put your opponent in check!";
      }
  
      return feedback || "Nice move!";
    }
  
    intermediateAnalysis(move, chess) {
      // Intermediate level feedback, with some strategic advice
      let feedback = '';
  
      if (move.captured) {
        feedback += `You captured a ${move.captured}. Well done! `;
      }
  
      // Encourage castling if possible
      if (!chess.get(move.to).type === 'k' && this.isCastlingBeneficial(chess)) {
        feedback += "Consider castling to protect your king and connect your rooks. ";
      }
  
      if (chess.in_check()) {
        feedback += "You put your opponent in check! Keep the pressure on!";
      }
  
      if (this.isFork(move, chess)) {
        feedback += "Nice! You've created a fork!";
      }
  
      return feedback || "Good move. Keep it up!";
    }
  
    advancedAnalysis(move, chess) {
      // Advanced level feedback, with deep strategic insights
      let feedback = '';
  
      if (move.captured) {
        feedback += `You captured a ${move.captured}. Evalua
  