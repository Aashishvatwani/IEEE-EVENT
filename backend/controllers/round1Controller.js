import Team from '../models/Team.js';
import QuizQuestion from '../models/QuizQuestion.js';
import Component from '../models/Component.js';

// @desc    Get all quiz questions
// @route   GET /api/round1/quiz
// @access  Public
export const getQuizQuestions = async (req, res) => {
  try {
    // Do NOT include correctAnswer in the response so answers cannot be inspected client-side
    const questions = await QuizQuestion.find({ isActive: true })
      .limit(12)
      .select('-correctAnswer');

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Get quiz questions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching quiz questions'
    });
  }
};

// @desc    Submit a single quiz answer (server-side validation)
// @route   POST /api/round1/quiz/answer
// @access  Public
export const submitAnswer = async (req, res) => {
  try {
    const { teamId, questionId, answer } = req.body;

    if (!teamId || !questionId || typeof answer === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'teamId, questionId and answer are required'
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const question = await QuizQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Prevent answering the same question multiple times
    team.round1.answeredQuestions = team.round1.answeredQuestions || [];
    if (team.round1.answeredQuestions.includes(String(questionId))) {
      return res.status(400).json({ success: false, message: 'Question already answered' });
    }

    // Normalize function for comparison (basic cleanup)
    const normalize = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

    // Levenshtein distance for fuzzy matching
    const levenshtein = (a = '', b = '') => {
      const m = a.length;
      const n = b.length;
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
      }
      return dp[m][n];
    };

    // Determine correct text from options (fallback: empty string)
    const correctIndex = Number(question.correctAnswer);
    const correctText = Array.isArray(question.options) && question.options[correctIndex]
      ? question.options[correctIndex]
      : '';

    const normAnswer = normalize(answer);
    const normCorrect = normalize(correctText);

    // Token-based relaxed matching
    const stopwords = new Set(['the', 'a', 'an', 'module', 'unit', 'device', 'board', 'system', 'node']);
    const tokens = (s) => s.split(' ').filter(t => t && !stopwords.has(t));
    const ansTokens = tokens(normAnswer);
    const corrTokens = tokens(normCorrect);

    // synonyms map for common keywords used in this quiz
    const synonyms = {
      sensor: ['sensor', 'sensors', 'sensormodule', 'sensormodule', 'sensor-module', 'multisensor', 'multi sensor', 'multi-sensor', 'multi sensor module'],
      'signal scaling': ['signal scaling', 'signal-scale', 'signal scaling module', 'signal scaling unit', 'signal scaling stage', 'signal scaling circuit', 'signal scaling'],
      microcontroller: ['microcontroller', 'mcu', 'controller'],
      'communication module': ['communication module', 'comm module', 'comm', 'communication', 'communication-module'],
      'cloud storage': ['cloud storage', 'cloud', 'cloudstorage', 'cloud-storage'],
      actuator: ['actuator', 'actuators', 'motor', 'relay'],
      resistor: ['resistor', 'resistors'],
      capacitor: ['capacitor', 'capacitors'],
      diode: ['diode', 'diodes'],
      inductor: ['inductor', 'inductors'],
      mouse: ['mouse', 'computer mouse'],
      keyboard: ['keyboard', 'key board']
    };

    const tokenMatches = (aTokens, bTokens) => {
      if (aTokens.length === 0 || bTokens.length === 0) return false;
      // exact token intersection
      const setA = new Set(aTokens);
      const setB = new Set(bTokens);
      let intersect = 0;
      for (const t of setA) if (setB.has(t)) intersect++;
      if (intersect > 0) return true;

      // synonyms check
      for (const key of Object.keys(synonyms)) {
        const syns = synonyms[key].map(s => normalize(s));
        const keyInA = aTokens.some(t => syns.includes(t));
        const keyInB = bTokens.some(t => syns.includes(t));
        if (keyInA && keyInB) return true;
      }

      // substring containment fallback
      if (aTokens.join(' ').includes(bTokens.join(' ')) || bTokens.join(' ').includes(aTokens.join(' '))) return true;

      return false;
    };

    // Handle empty answers
    if (!normAnswer) {
      isCorrect = false;
      console.log('Empty answer submitted');
      return res.status(200).json({
        success: true,
        data: {
          correct: false,
          earnedAmount: team.round1.earnedAmount,
          totalBalance: team.round1.totalBalance
        }
      });
    }

    // Initialize validation
    let isCorrect = false;

    // Simple text cleanup (only lowercase and trim)
    const cleanText = (text) => {
      if (!text) return '';
      return text.toLowerCase().trim();
    };

    // Check if it's a multiple choice question
    const isMultipleChoice = Array.isArray(question.options) && 
                           question.options.length > 0;

    if (isMultipleChoice) {
      // For multiple choice questions
      const userInput = cleanText(answer);
      
      // First try direct number matching
      if (/^\d+$/.test(userInput)) {
        const userNum = parseInt(userInput, 10);
        isCorrect = userNum === parseInt(question.correctAnswer, 10);
      } 
      // Then try matching with option text
      else {
        const correctOption = cleanText(question.options[parseInt(question.correctAnswer, 10)]);
        isCorrect = userInput === correctOption;
      }
      
      // Log the multiple choice check
      console.log('Multiple choice check:', {
        userInput,
        correctAnswer: question.correctAnswer,
        correctOption: question.options[parseInt(question.correctAnswer, 10)],
        isCorrect
      });
    } else {
      // For text answer questions
      const userInput = cleanText(answer);
      const correctAnswer = cleanText(question.correctAnswer);
      
      // Log the text comparison
      console.log('Text answer check:', {
        userInput,
        correctAnswer
      });
      
      // Exact match check
      if (userInput === correctAnswer) {
        isCorrect = true;
      } else {
        // Check for common variations
        const variations = [
          userInput,
          userInput.replace(/\s+/g, ''),  // no spaces
          userInput.replace(/[\s\-_]+/g, '') // no spaces or dashes
        ];
        
        const correctVariations = [
          correctAnswer,
          correctAnswer.replace(/\s+/g, ''),  // no spaces
          correctAnswer.replace(/[\s\-_]+/g, '') // no spaces or dashes
        ];
        
        // Check all variations against each other
        for (const uVar of variations) {
          for (const cVar of correctVariations) {
            if (uVar === cVar) {
              isCorrect = true;
              break;
            }
          }
          if (isCorrect) break;
        }
      }
      
      // Log the final result
      console.log('Final result:', { isCorrect });
    }

    // fuzzy fallback (small typos) using Levenshtein
    if (!isCorrect && normAnswer.length > 0 && normCorrect.length > 0) {
      const dist = levenshtein(normAnswer, normCorrect);
      const maxLen = Math.max(normAnswer.length, normCorrect.length);
      const similarity = 1 - dist / maxLen;
      
      // More lenient threshold for longer answers
      const threshold = maxLen > 10 ? 0.6 : 0.75;
      
      if (dist <= 2 || similarity >= threshold) {
        isCorrect = true;
        matchReason = `fuzzy(dist=${dist},sim=${similarity.toFixed(2)})`;
      }
    }

    // Log answer details for debugging
    console.log('Answer check:', {
      questionId,
      userAnswer,
      correctAnswer: isMultipleChoice ? correctOptionIndex : question.correctAnswer,
      isMultipleChoice,
      isCorrect
    });

    // Initialize bonus if not set
    const bonusAmount = parseInt(process.env.QUIZ_BONUS) || 1200;
    if (!team.round1.totalBalance || team.round1.totalBalance === 0) {
      team.round1.totalBalance = bonusAmount;
      team.round1.earnedAmount = team.round1.earnedAmount || 0;
    }

    const points = question.points || 100;
    if (isCorrect) {
      team.round1.earnedAmount = (team.round1.earnedAmount || 0) + points;
      team.round1.totalBalance = (team.round1.totalBalance || 0) + points;
    }

    team.round1.answeredQuestions.push(String(questionId));

    await team.save();

    return res.status(200).json({
      success: true,
      data: {
        correct: isCorrect,
        earnedAmount: team.round1.earnedAmount,
        totalBalance: team.round1.totalBalance
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error submitting answer' });
  }
};

// @desc    Submit quiz answers and calculate score
// @route   POST /api/round1/quiz/submit
// @access  Public
export const submitQuiz = async (req, res) => {
  try {
    const { teamId, answers } = req.body;

    console.log('Quiz submission received:', { teamId, answersCount: answers?.length });

    if (!teamId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Team ID and answers are required'
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Get all questions in the same order they were sent
    const questions = await QuizQuestion.find({ isActive: true }).limit(12);
    
    console.log('Questions count:', questions.length);
    
    // Calculate correct answers
    let correctCount = 0;
    
    answers.forEach((selectedAnswer, index) => {
      if (questions[index]) {
        const correctAnswer = Number(questions[index].correctAnswer);
        const selected = Number(selectedAnswer);
        
        console.log(`Q${index + 1}: Selected=${selected}, Correct=${correctAnswer}, Match=${selected === correctAnswer}`);
        
        if (selected === correctAnswer) {
          correctCount++;
        }
      }
    });

    console.log('Total correct:', correctCount, 'out of', questions.length);

    const quizScore = correctCount;
    const earnedAmount = correctCount * 100;
    const bonusAmount = parseInt(process.env.QUIZ_BONUS) || 1200;
    const totalBalance = earnedAmount + bonusAmount;

    // Update team Round 1 data
    team.round1.quizScore = quizScore;
    team.round1.earnedAmount = earnedAmount;
    team.round1.totalBalance = totalBalance;
    
    await team.save();

    console.log('Quiz results saved:', { quizScore, earnedAmount, totalBalance });

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        earnedAmount,
        bonusAmount,
        totalBalance
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting quiz'
    });
  }
};

// @desc    Get all available components
// @route   GET /api/round1/components
// @access  Public
export const getComponents = async (req, res) => {
  try {
    const components = await Component.find({ isAvailable: true });

    res.status(200).json({
      success: true,
      count: components.length,
      data: components
    });
  } catch (error) {
    console.error('Get components error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching components'
    });
  }
};

// @desc    Purchase components
// @route   POST /api/round1/purchase
// @access  Public
export const purchaseComponents = async (req, res) => {
  try {
    const { teamId, componentIds } = req.body;

    console.log('Purchase request received:', { teamId, componentIds, type: typeof componentIds });

    if (!teamId || !componentIds || componentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Team ID and component IDs are required'
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if already purchased (one-time purchase only)
    if (team.round1.submitted) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased components. You cannot buy more components.'
      });
    }

    // Get components to purchase
    const components = await Component.find({ _id: { $in: componentIds } });
    
    console.log('Found components:', components.length, 'Expected:', componentIds.length);
    
    if (components.length !== componentIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some components not found'
      });
    }

    // Must buy exactly 6 components
    if (componentIds.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'You must purchase exactly 6 components'
      });
    }

    // Calculate total cost
    const totalCost = components.reduce((sum, comp) => sum + comp.price, 0);

    // Check balance
    if (totalCost > team.round1.totalBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        required: totalCost,
        available: team.round1.totalBalance
      });
    }

    // Save purchased components
    team.round1.purchasedComponents = components.map(comp => ({
      componentId: comp._id,
      name: comp.name,
      type: comp.type,
      price: comp.price,
      icon: comp.icon
    }));
    
    // Deduct cost from balance
    team.round1.totalBalance -= totalCost;
    
    // Mark as submitted (one-time purchase)
    team.round1.submitted = true;
    team.round1.submittedAt = new Date();
    
    // Calculate Round 1 final score (based on remaining balance)
    team.round1.finalScore = team.round1.totalBalance;

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Components purchased successfully. Proceed to Round 2 to arrange them!',
      data: {
        purchasedComponents: team.round1.purchasedComponents,
        totalCost,
        remainingBalance: team.round1.totalBalance,
        round1Score: team.round1.finalScore
      }
    });
  } catch (error) {
    console.error('Purchase components error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error purchasing components'
    });
  }
};

// @desc    Get team's Round 1 data
// @route   GET /api/round1/team/:teamId
// @access  Public
export const getRound1Data = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team.round1
    });
  } catch (error) {
    console.error('Get Round 1 data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching Round 1 data'
    });
  }
};
