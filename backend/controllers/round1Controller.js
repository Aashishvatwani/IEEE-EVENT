import Team from '../models/Team.js';
import QuizQuestion from '../models/QuizQuestion.js';
import Component from '../models/Component.js';

// @desc    Get all quiz questions
// @route   GET /api/round1/quiz
// @access  Public
export const getQuizQuestions = async (req, res) => {
  try {
    // Fetch questions but exclude correctAnswer from response for security
    const questions = await QuizQuestion.find({ isActive: true })
      .select('-correctAnswer')  // Exclude correctAnswer field
      .limit(12);

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

// @desc    Validate a single quiz answer
// @route   POST /api/round1/quiz/validate
// @access  Public
export const validateAnswer = async (req, res) => {
  try {
    const { questionIndex, selectedAnswer } = req.body;

    if (questionIndex === undefined || selectedAnswer === null) {
      return res.status(400).json({
        success: false,
        message: 'Question index and selected answer are required'
      });
    }

    // Get all questions in the same order they were sent to frontend
    const questions = await QuizQuestion.find({ isActive: true }).limit(12);
    
    if (questionIndex < 0 || questionIndex >= questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }

    const question = questions[questionIndex];
    const correctAnswer = Number(question.correctAnswer);
    const selected = Number(selectedAnswer);
    const isCorrect = selected === correctAnswer;

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: isCorrect ? null : correctAnswer, // Only send correct answer if wrong
        earnedAmount: isCorrect ? 100 : 0
      }
    });
  } catch (error) {
    console.error('Validate answer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error validating answer'
    });
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
