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
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

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
    }
  };

  const handleNext = (autoSubmit = false) => {
    // For auto-submit (time out), save answer as incorrect
    if (autoSubmit) {
      const newAnswers = [...answers, {
        questionId: questions[currentQuestion].id || questions[currentQuestion]._id,
        selectedAnswer: null,
        correct: false,
        timeTaken: 120
      }];
      setAnswers(newAnswers);
      localStorage.setItem('quizAnswers', JSON.stringify(newAnswers));

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeLeft(120);
        setIsAnswered(false);
        setValidationResult(null);
      } else {
        // Quiz complete - clear progress from localStorage
        clearQuizProgress();
        
        onComplete({
          answers: newAnswers,
          totalQuestions: questions.length
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer !== null && !isValidating) {
      setIsValidating(true);
      
      try {
        // Call backend to validate the answer using question index
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round1/quiz/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            questionIndex: currentQuestion,  // Send index instead of ID
            selectedAnswer: selectedAnswer
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          setValidationResult(data.data);
          setIsAnswered(true);
          
          // Save answer with validation result
          const newAnswers = [...answers, {
            questionId: questions[currentQuestion].id || questions[currentQuestion]._id,
            selectedAnswer: selectedAnswer,
            correct: data.data.isCorrect,
            timeTaken: 120 - timeLeft
          }];
          setAnswers(newAnswers);
          localStorage.setItem('quizAnswers', JSON.stringify(newAnswers));
          
          // Move to next question after showing result
          setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
              setCurrentQuestion(currentQuestion + 1);
              setSelectedAnswer(null);
              setTimeLeft(120);
              setIsAnswered(false);
              setValidationResult(null);
            } else {
              // Quiz complete - clear progress from localStorage
              clearQuizProgress();
              
              // Send completed quiz data
              onComplete({
                answers: newAnswers,
                totalQuestions: questions.length
              });
            }
          }, 2000);
        } else {
          alert('Failed to validate answer. Please try again.');
        }
      } catch (error) {
        console.error('Validation error:', error);
        alert('Network error. Please check your connection.');
      } finally {
        setIsValidating(false);
      }
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
              const isSelectedOption = selectedAnswer === index;
              const isCorrectOption = validationResult && validationResult.correctAnswer === index;
              const isWrongOption = validationResult && !validationResult.isCorrect && isSelectedOption;
              
              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`quiz-option ${
                    isSelectedOption ? 'selected' : ''
                  } ${
                    isAnswered && validationResult?.isCorrect && isSelectedOption
                      ? 'correct'
                      : isAnswered && isWrongOption
                      ? 'incorrect'
                      : isAnswered && isCorrectOption
                      ? 'correct'
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
                  {isAnswered && validationResult?.isCorrect && isSelectedOption && (
                    <span className="option-icon">✓</span>
                  )}
                  {isAnswered && isWrongOption && (
                    <span className="option-icon">✗</span>
                  )}
                  {isAnswered && isCorrectOption && !validationResult?.isCorrect && (
                    <span className="option-icon">✓</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="quiz-actions">
            {isAnswered && validationResult && (
              <motion.div 
                className={`answer-feedback ${validationResult.isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {validationResult.isCorrect ? (
                  <>
                    <span className="feedback-icon">🎉</span>
                    <span className="feedback-text">Correct! +₹{validationResult.earnedAmount}</span>
                  </>
                ) : (
                  <>
                    <span className="feedback-icon">❌</span>
                    <span className="feedback-text">
                      Incorrect! Correct answer was {String.fromCharCode(65 + validationResult.correctAnswer)}
                    </span>
                  </>
                )}
              </motion.div>
            )}
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || isAnswered || isValidating}
              className="quiz-submit-btn"
            >
              {isValidating ? 'Validating...' : isAnswered ? 'Moving to next...' : 'Submit Answer'}
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
