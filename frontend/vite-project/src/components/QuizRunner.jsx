import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './QuizRunner.css';

const QuizRunner = ({ questions, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const saved = localStorage.getItem('quizCurrentQuestion');
    return saved ? parseInt(saved) : 0;
  });
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('quizTimeLeft');
    return saved ? parseInt(saved) : 120;
  });
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem('quizAnswers');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAnswered, setIsAnswered] = useState(false);

  // Save quiz progress to localStorage
  useEffect(() => {
    localStorage.setItem('quizCurrentQuestion', currentQuestion.toString());
  }, [currentQuestion]);

  useEffect(() => {
    localStorage.setItem('quizTimeLeft', timeLeft.toString());
  }, [timeLeft]);

  useEffect(() => {
    if (answers.length > 0) {
      localStorage.setItem('quizAnswers', JSON.stringify(answers));
    }
  }, [answers]);

  // Clear quiz data when quiz is complete
  const clearQuizProgress = () => {
    localStorage.removeItem('quizCurrentQuestion');
    localStorage.removeItem('quizTimeLeft');
    localStorage.removeItem('quizAnswers');
  };

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleNext(true); // Auto-submit when time runs out
    }
  }, [timeLeft, isAnswered]);

  const handleAnswerSelect = (index) => {
    if (!isAnswered) {
      setSelectedAnswer(index);
      console.log('Selected answer:', index, 'Type:', typeof index);
      console.log('Correct answer:', questions[currentQuestion].correctAnswer, 'Type:', typeof questions[currentQuestion].correctAnswer);
      console.log('Are they equal?', index === questions[currentQuestion].correctAnswer);
      console.log('Full question object:', questions[currentQuestion]);
    }
  };

  const handleNext = (autoSubmit = false) => {
    const correctAnswerIndex = Number(questions[currentQuestion].correctAnswer);
    const selectedAnswerIndex = Number(selectedAnswer);
    const isCorrect = autoSubmit ? false : selectedAnswerIndex === correctAnswerIndex;
    
    console.log('Checking answer:', {
      selectedAnswer: selectedAnswerIndex,
      selectedAnswerType: typeof selectedAnswerIndex,
      correctAnswerIndex,
      correctAnswerType: typeof correctAnswerIndex,
      isCorrect,
      rawCorrectAnswer: questions[currentQuestion].correctAnswer,
      question: questions[currentQuestion].question
    });
    
    const newAnswers = [...answers, {
      questionId: questions[currentQuestion].id,
      selectedAnswer: autoSubmit ? null : selectedAnswerIndex,
      correct: isCorrect,
      timeTaken: 120 - timeLeft
    }];
    setAnswers(newAnswers);
    localStorage.setItem('quizAnswers', JSON.stringify(newAnswers));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setTimeLeft(120);
      setIsAnswered(false);
    } else {
      // Quiz complete - clear progress from localStorage
      clearQuizProgress();
      
      const correctCount = newAnswers.filter(a => a.correct).length;
      const earnedAmount = correctCount * 100;
      onComplete({
        answers: newAnswers,
        correctCount,
        earnedAmount,
        totalQuestions: questions.length
      });
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      setIsAnswered(true);
      console.log('Answer submitted.');
      console.log('Selected:', selectedAnswer, 'Correct:', questions[currentQuestion].correctAnswer);
      console.log('Comparison:', selectedAnswer === questions[currentQuestion].correctAnswer);
      console.log('Number Comparison:', Number(selectedAnswer) === Number(questions[currentQuestion].correctAnswer));
      setTimeout(() => handleNext(), 2000); // Increased to 2 seconds to see the result
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="quiz-runner">
      {/* Progress Bar */}
      <div className="quiz-progress-bar">
        <motion.div 
          className="quiz-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-info">
          <span className="quiz-question-number">
            Question {currentQuestion + 1} / {questions.length}
          </span>
          <span className="quiz-category">
            {questions[currentQuestion].category.toUpperCase()}
          </span>
        </div>
        <div className={`quiz-timer ${timeLeft < 30 ? 'warning' : ''}`}>
          <span className="timer-icon">⏱️</span>
          <span className="timer-text">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="quiz-question-card"
        >
          <h2 className="quiz-question-text">
            {questions[currentQuestion].question}
          </h2>

          <div className="quiz-options">
            {questions[currentQuestion].options.map((option, index) => {
              const correctAnswerNum = Number(questions[currentQuestion].correctAnswer);
              const isCorrectOption = index === correctAnswerNum;
              const isSelectedOption = selectedAnswer === index;
              
              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`quiz-option ${
                    isSelectedOption ? 'selected' : ''
                  } ${
                    isAnswered && isCorrectOption
                      ? 'correct'
                      : isAnswered && isSelectedOption && !isCorrectOption
                      ? 'incorrect'
                      : ''
                  }`}
                  whileHover={{ scale: isAnswered ? 1 : 1.02 }}
                  whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                  disabled={isAnswered}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="option-text">{option}</span>
                  {isAnswered && isCorrectOption && (
                    <span className="option-icon">✓</span>
                  )}
                  {isAnswered && isSelectedOption && !isCorrectOption && (
                    <span className="option-icon">✗</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="quiz-actions">
            {isAnswered && (
              <motion.div 
                className={`answer-feedback ${Number(selectedAnswer) === Number(questions[currentQuestion].correctAnswer) ? 'feedback-correct' : 'feedback-incorrect'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {Number(selectedAnswer) === Number(questions[currentQuestion].correctAnswer) ? (
                  <>
                    <span className="feedback-icon">🎉</span>
                    <span className="feedback-text">Correct! +₹100</span>
                  </>
                ) : (
                  <>
                    <span className="feedback-icon">❌</span>
                    <span className="feedback-text">Incorrect! Correct answer was {String.fromCharCode(65 + Number(questions[currentQuestion].correctAnswer))}</span>
                  </>
                )}
              </motion.div>
            )}
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || isAnswered}
              className="quiz-submit-btn"
            >
              {isAnswered ? 'Moving to next...' : 'Submit Answer'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Stats Footer */}
      <div className="quiz-stats">
        <div className="stat">
          <span className="stat-label">Answered</span>
          <span className="stat-value">{answers.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Correct</span>
          <span className="stat-value correct">{answers.filter(a => a.correct).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Earned</span>
          <span className="stat-value earned">₹{answers.filter(a => a.correct).length * 100}</span>
        </div>
      </div>
    </div>
  );
};

export default QuizRunner;
