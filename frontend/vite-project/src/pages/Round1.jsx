import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import QuizRunner from '../components/QuizRunner';
import ComponentStore from '../components/ComponentStore';
import './Round1.css';

const Round1 = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(() => localStorage.getItem('round1Phase') || 'intro');
  const [quizResults, setQuizResults] = useState(() => {
    const saved = localStorage.getItem('round1QuizResults');
    return saved ? JSON.parse(saved) : null;
  });
  const [purchaseResults, setPurchaseResults] = useState(() => {
    const saved = localStorage.getItem('round1PurchaseResults');
    return saved ? JSON.parse(saved) : null;
  });
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [componentStore, setComponentStore] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamId, setTeamId] = useState(localStorage.getItem('teamId') || null);
  const [bonusAmount, setBonusAmount] = useState(() => {
    const saved = localStorage.getItem('round1Bonus');
    return saved ? parseInt(saved) : 1200;
  });
  const [countdown, setCountdown] = useState(5);

  // Save phase to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('round1Phase', phase);
  }, [phase]);

  // Save quizResults to localStorage whenever they change
  useEffect(() => {
    if (quizResults) {
      localStorage.setItem('round1QuizResults', JSON.stringify(quizResults));
    }
  }, [quizResults]);

  // Save purchaseResults to localStorage whenever they change
  useEffect(() => {
    if (purchaseResults) {
      localStorage.setItem('round1PurchaseResults', JSON.stringify(purchaseResults));
    }
  }, [purchaseResults]);

  // Save bonusAmount to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('round1Bonus', bonusAmount.toString());
  }, [bonusAmount]);

  // Check if team is registered
  useEffect(() => {
    const storedTeamId = localStorage.getItem('teamId');
    if (!storedTeamId) {
      // Redirect to registration if no team ID found
      navigate('/register');
      return;
    }
    setTeamId(storedTeamId);
  }, [navigate]);

  // Fetch quiz questions and components on mount
  useEffect(() => {
    if (!teamId) return; // Don't fetch if no teamId

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch quiz questions
        const quizRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round1/quiz`);
        const quizData = await quizRes.json();
        
        if (!quizRes.ok) {
          throw new Error(quizData.message || 'Failed to load quiz questions');
        }

        // Transform backend data to match frontend format
        const transformedQuestions = quizData.data.map((q, index) => ({
          id: index + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          category: q.category
        }));
        
        setQuizQuestions(transformedQuestions);

        // Fetch components
        const compRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round1/components`);
        const compData = await compRes.json();
        
        if (!compRes.ok) {
          throw new Error(compData.message || 'Failed to load components');
        }

        // Transform components data
        const transformedComponents = compData.data.map((c, index) => ({
          id: index + 1,
          code: c._id,
          name: c.name,
          price: c.price,
          description: c.description,
          tags: [c.type, c.category],
          icon: c.icon,
          essential: c.category === 'essential',
          type: c.type
        }));

        setComponentStore(transformedComponents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]); // Add teamId as dependency

  // Check if team ID exists
  useEffect(() => {
    if (!teamId && phase !== 'intro') {
      const storedTeamId = prompt('Please enter your Team ID:');
      if (storedTeamId) {
        localStorage.setItem('teamId', storedTeamId);
        setTeamId(storedTeamId);
      } else {
        alert('Team ID is required to continue');
        navigate('/register');
      }
    }
  }, [teamId, phase, navigate]);

  // Countdown timer for auto-redirect to Round 2
  useEffect(() => {
    if (phase === 'complete' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'complete' && countdown === 0) {
      navigate('/round2');
    }
  }, [phase, countdown, navigate]);


  const handleQuizComplete = async (results) => {
    if (!teamId) {
      alert('Team ID is required. Please register first.');
      navigate('/register');
      return;
    }

    try {
      // Extract just the answer indices for backend
      const answerIndices = results.answers.map(a => a.selectedAnswer !== null ? a.selectedAnswer : -1);

      // Submit quiz to backend
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round1/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamId,
          answers: answerIndices
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit quiz');
      }

      // Update quiz results with backend response
      setQuizResults({
        correctCount: data.data.correctAnswers,
        totalQuestions: data.data.totalQuestions,
        earnedAmount: data.data.earnedAmount,
        bonusAmount: data.data.bonusAmount,
        totalBalance: data.data.totalBalance
      });

      setBonusAmount(data.data.bonusAmount);
      setTimeout(() => setPhase('store'), 2000);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Failed to submit quiz: ' + err.message);
    }
  };

  const handlePurchaseComplete = async (results) => {
    if (!teamId) {
      alert('Team ID is required');
      return;
    }

    try {
      // Extract component IDs (MongoDB _id values stored in 'code' field)
      const componentIds = results.components.map(c => c.code);

      console.log('Sending purchase request:', { teamId, componentIds });

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round1/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamId,
          componentIds
        })
      });

      const data = await res.json();
      
      console.log('Purchase response:', data);
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to purchase components');
      }

      // Update purchase results with backend response
      setPurchaseResults({
        components: results.components,
        totalSpent: data.data.totalCost,
        remainingBalance: data.data.remainingBalance
      });

      setPhase('complete');
      setCountdown(5); // Reset countdown to 5 seconds
    } catch (err) {
      console.error('Error purchasing components:', err);
      alert('Failed to purchase components: ' + err.message);
    }
  };

  const startQuiz = () => {
    if (quizQuestions.length === 0) {
      alert('Quiz questions are still loading. Please wait.');
      return;
    }
    setPhase('quiz');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="round1-page">
        <div className="round1-bg"></div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="round1-header"
        >
          <div className="round-badge">ROUND 1</div>
          <h1 className="round1-title">Component Quest</h1>
          <p className="round1-subtitle">Loading...</p>
        </motion.div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          <div className="loading-spinner" style={{ fontSize: '2rem' }}>⚙️</div>
          <p>Loading quiz questions and components...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="round1-page">
        <div className="round1-bg"></div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="round1-header"
        >
          <div className="round-badge">ROUND 1</div>
          <h1 className="round1-title">Component Quest</h1>
          <p className="round1-subtitle" style={{ color: '#ff6b6b' }}>Error</p>
        </motion.div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: '#ff6b6b' }}>Failed to Load Data</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="round1-page">
      {/* Background */}
      <div className="round1-bg"></div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="round1-header"
      >
        <div className="round-badge">ROUND 1</div>
        <h1 className="round1-title">Component Quest</h1>
        <p className="round1-subtitle">Earn. Buy. Build.</p>
      </motion.div>

      {/* Intro Phase */}
      {phase === 'intro' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="intro-section"
        >
          <div className="intro-card">
            <h2>Mission Briefing</h2>
            <div className="briefing-content">
              <div className="briefing-item">
                <span className="briefing-icon">💰</span>
                <div>
                  <h3>Starting Bonus</h3>
                  <p>You begin with ₹{bonusAmount} in your account</p>
                </div>
              </div>

              <div className="briefing-item">
                <span className="briefing-icon">❓</span>
                <div>
                  <h3>Answer Questions</h3>
                  <p>12 questions • ₹100 per correct answer • 2 minutes each</p>
                </div>
              </div>

              <div className="briefing-item">
                <span className="briefing-icon">🛒</span>
                <div>
                  <h3>Purchase Components</h3>
                  <p>Buy exactly 6 components from the store using your funds</p>
                </div>
              </div>

              <div className="briefing-item">
                <span className="briefing-icon">⚠️</span>
                <div>
                  <h3>Important Warning</h3>
                  <p>If you drop a purchased component later, money will NOT be refunded!</p>
                </div>
              </div>

              <div className="briefing-item">
                <span className="briefing-icon">🎯</span>
                <div>
                  <h3>Scoring</h3>
                  <p>Your Round 1 score = Amount remaining after purchasing 6 components</p>
                </div>
              </div>
            </div>

            <button className="start-quiz-btn" onClick={startQuiz}>
              <span className="btn-glow"></span>
              Begin Component Quest
            </button>
          </div>
        </motion.div>
      )}

      {/* Quiz Phase */}
      {phase === 'quiz' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="quiz-section"
        >
          <QuizRunner questions={quizQuestions} onComplete={handleQuizComplete} />
        </motion.div>
      )}

      {/* Quiz Results Transition */}
      {phase === 'quiz' && quizResults && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="quiz-results-overlay"
        >
          <div className="results-card">
            <h2>Quiz Complete!</h2>
            <div className="results-stats">
              <div className="result-stat">
                <span className="stat-label">Correct Answers</span>
                <span className="stat-value">{quizResults.correctCount} / {quizResults.totalQuestions}</span>
              </div>
              <div className="result-stat">
                <span className="stat-label">Earned</span>
                <span className="stat-value earned">₹{quizResults.earnedAmount}</span>
              </div>
              <div className="result-stat">
                <span className="stat-label">Starting Bonus</span>
                <span className="stat-value">₹{bonusAmount}</span>
              </div>
              <div className="result-stat total">
                <span className="stat-label">Total Balance</span>
                <span className="stat-value total">₹{quizResults.totalBalance}</span>
              </div>
            </div>
            <p className="transition-text">Loading Component Store...</p>
          </div>
        </motion.div>
      )}

      {/* Store Phase */}
      {phase === 'store' && quizResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="store-section"
        >
          <div className="store-instructions">
            <h2>Component Store</h2>
            <p>Use your balance of <strong>₹{quizResults.totalBalance}</strong> to purchase exactly 6 components.</p>
            <p className="warning-text">⚠️ Choose wisely! Essential components are marked.</p>
          </div>
          
          <ComponentStore
            components={componentStore}
            initialBalance={quizResults.totalBalance}
            onPurchaseComplete={handlePurchaseComplete}
          />
        </motion.div>
      )}

      {/* Complete Phase */}
      {phase === 'complete' && purchaseResults && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="complete-section"
        >
          <div className="complete-card">
            <div className="success-icon">🎉</div>
            <h1>Round 1 Complete!</h1>
            
            <div className="final-summary">
              <h3>Your Performance</h3>
              
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Quiz Score</span>
                  <span className="summary-value">{quizResults.correctCount}/{quizResults.totalQuestions}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Earned from Quiz</span>
                  <span className="summary-value">₹{quizResults.earnedAmount}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Starting Bonus</span>
                  <span className="summary-value">₹{bonusAmount}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Available</span>
                  <span className="summary-value">₹{quizResults.totalBalance}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Spent</span>
                  <span className="summary-value">₹{purchaseResults.totalSpent}</span>
                </div>
                <div className="summary-item highlight">
                  <span className="summary-label">Round 1 Score</span>
                  <span className="summary-value glow">₹{purchaseResults.remainingBalance}</span>
                </div>
              </div>

              <div className="purchased-components-summary">
                <h4>Your Components for Round 2:</h4>
                <div className="component-chips">
                  {purchaseResults.components.map((comp) => (
                    <div key={comp.code} className="component-chip">
                      <span>{comp.icon}</span>
                      <span>{comp.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="redirect-message">
                <p>🚀 Redirecting to Round 2 in <strong>{countdown}</strong> seconds...</p>
              </div>

              <button className="proceed-btn" onClick={() => navigate('/round2')}>
                Proceed to Round 2 Now: System Genesis →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Round1;
