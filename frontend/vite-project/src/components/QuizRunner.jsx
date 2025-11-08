import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './QuizRunner.css';

const QuizRunner = ({ questions, onComplete }) => {
  const teamId = localStorage.getItem('teamId');
  const timerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('quiz_current_index');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'incorrect'
  const [answers, setAnswers] = useState([]);
  const answersRef = useRef([]);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [totalBalance, setTotalBalance] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    // Fetch team data to display name and starting balance
    const fetchTeam = async () => {
      try {
        if (!teamId) return;
        const res = await fetch(`http://localhost:5000/api/round1/team/${teamId}`);
        const data = await res.json();
        if (res.ok) {
          setTotalBalance(data.data.totalBalance || parseInt(localStorage.getItem('round1Bonus')) || 1200);
          // team name is not included in this endpoint; we can try to fetch team via /api/teams if present
          // fallback: use localStorage team display name if available
          const storedName = localStorage.getItem('teamName');
          if (storedName) setTeamName(storedName);
        }
      } catch (err) {
        console.error('Failed to load team data', err);
      }
    };

    fetchTeam();
  }, [teamId]);

  // Persist current index
  useEffect(() => {
    localStorage.setItem('quiz_current_index', String(currentIndex));
  }, [currentIndex]);

  // Reset timer for each new question
  useEffect(() => {
    const q = questions && questions[currentIndex];
    if (!q) return;

    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Always start with fresh timer for each question
    setTimeLeft(120);

    // Save current time when leaving/refreshing
    const handleBeforeUnload = () => {
      localStorage.setItem(`timer_${q.id}`, timeLeft.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIndex, questions]);



  const currentQuestion = questions[currentIndex];

  const submitAnswer = async (auto = false) => {
    if (!teamId) {
      alert('Team ID missing. Please register first.');
      return;
    }
    if (submitting) return;
    // allow auto submit with empty input
    if (!auto && !input) return;
    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/round1/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, questionId: currentQuestion.id, answer: auto ? '' : input })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Answer submission failed', data);
        setFeedback('incorrect');
        setAwaitingNext(true);
      } else {
        const isCorrect = data.data.correct;
        setFeedback(isCorrect ? 'correct' : 'incorrect');
        setEarnedAmount(data.data.earnedAmount || 0);
        setTotalBalance(data.data.totalBalance || totalBalance);

        const newAnswerRecord = { questionId: currentQuestion.id, answer: auto ? '' : input, correct: isCorrect };
        const newAnswersList = [...answersRef.current, newAnswerRecord];
        setAnswers(newAnswersList);
        answersRef.current = newAnswersList;
        setAwaitingNext(true);
      }
    } catch (err) {
      console.error('Submit answer error', err);
      setFeedback('incorrect');
    }

    setSubmitting(false);
    // Do not auto-advance. Show feedback and wait for user to click Next.
  };

  const handleNext = () => {
    setFeedback(null);
    setInput('');
    setAwaitingNext(false);
    
    // move to next question or finish
    if (currentIndex < questions.length - 1) {
      setTimeLeft(120); // Reset timer for new question
      setCurrentIndex(currentIndex + 1);
    } else {
      // Quiz complete
      const completedAnswers = answersRef.current;
      onComplete({
        answers: completedAnswers,
        correctCount: completedAnswers.filter(a => a.correct).length,
        earnedAmount: earnedAmount,
        totalQuestions: questions.length
      });
    }
  };

  // Timer effect - resets on question change and handles countdown
  useEffect(() => {
    // Reset timer when question changes
    setTimeLeft(120);

    // Start countdown if not showing feedback
    if (!feedback && !submitting && !awaitingNext) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(timerRef.current);
            submitAnswer(true);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIndex, feedback, submitting, awaitingNext]);

  return (
    <div className="quiz-runner">
      <div className="quiz-header">
        <div>
          <div className="round-badge small">ROUND 1</div>
          <h3>Component Quest</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem' }}>{teamName || 'Your Team'}</div>
          <div style={{ fontWeight: '700' }}>₹{totalBalance ?? (parseInt(localStorage.getItem('round1Bonus')) || 1200)}</div>
        </div>
      </div>

      <motion.div className="quiz-question-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="quiz-question-text">{currentQuestion.question}</h2>

        <div style={{ marginTop: '1rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer here..."
            className={`text-answer-input ${feedback === 'correct' ? 'input-correct' : ''} ${feedback === 'incorrect' ? 'input-incorrect' : ''}`}
            disabled={!!feedback || awaitingNext || submitting}
          />
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="quiz-submit-btn" onClick={() => submitAnswer(false)} disabled={submitting || awaitingNext || (!!feedback && !awaitingNext)}>
            Submit Answer
          </button>
          {feedback === 'correct' && <div className="feedback-correct">✓ Correct +₹100</div>}
          {feedback === 'incorrect' && <div className="feedback-incorrect">✗ Incorrect</div>}
          {awaitingNext && (
            <button className="quiz-submit-btn" style={{ marginLeft: 8 }} onClick={handleNext}>
              Next ➜
            </button>
          )}
        </div>

        <div style={{ marginTop: '1.2rem', color: '#ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Question {currentIndex + 1} / {questions.length}</div>
          <div className={`quiz-timer ${timeLeft < 30 ? 'warning' : ''}`} style={{ padding: '0.2rem 0.6rem', borderRadius: 8, fontSize: '0.95rem' }}>
            <span className="timer-icon">⏱️</span>
            <span style={{ marginLeft: 6 }}>{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span>
          </div>
        </div>
      </motion.div>

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
          <span className="stat-value earned">₹{earnedAmount}</span>
        </div>
      </div>
    </div>
  );
};

export default QuizRunner;
