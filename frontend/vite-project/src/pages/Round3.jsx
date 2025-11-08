import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Round3.css';

const Round3 = () => {
  const navigate = useNavigate();
  const [teamId] = useState(localStorage.getItem('teamId') || null);
  const [sector, setSector] = useState(localStorage.getItem('sector') || null);
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const saved = localStorage.getItem('round3TimeRemaining');
    return saved ? parseInt(saved) : 25 * 60;
  });
  const [hasStarted, setHasStarted] = useState(() => {
    const saved = localStorage.getItem('round3HasStarted');
    return saved === 'true';
  });
  const [isSubmitted, setIsSubmitted] = useState(() => {
    const saved = localStorage.getItem('round3IsSubmitted');
    return saved === 'true';
  });
  const [testCasesPassed, setTestCasesPassed] = useState(() => {
    const saved = localStorage.getItem('round3TestCasesPassed');
    return saved ? parseInt(saved) : 0;
  });
  const [manualTime, setManualTime] = useState(() => {
    const saved = localStorage.getItem('round3ManualTime');
    return saved || '';
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [unstopLink, setUnstopLink] = useState(() => {
    const saved = localStorage.getItem('round3UnstopLink');
    return saved || '';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [round3Data, setRound3Data] = useState(null);
  const [teamData, setTeamData] = useState(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('round3TimeRemaining', timeRemaining.toString());
  }, [timeRemaining]);

  useEffect(() => {
    localStorage.setItem('round3HasStarted', hasStarted.toString());
  }, [hasStarted]);

  useEffect(() => {
    localStorage.setItem('round3IsSubmitted', isSubmitted.toString());
  }, [isSubmitted]);

  useEffect(() => {
    localStorage.setItem('round3TestCasesPassed', testCasesPassed.toString());
  }, [testCasesPassed]);

  useEffect(() => {
    localStorage.setItem('round3ManualTime', manualTime);
  }, [manualTime]);

  useEffect(() => {
    if (unstopLink) {
      localStorage.setItem('round3UnstopLink', unstopLink);
    }
  }, [unstopLink]);

  // Fetch team data and challenge link on mount
  useEffect(() => {
    // Check if team is registered
    if (!teamId) {
      navigate('/register');
      return;
    }

    const fetchTeamData = async () => {
      if (!teamId) {
        setError('Team ID not found. Please register first.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch challenge link and team sector
        const challengeRes = await fetch(` https://nsoc-event.onrender.com/api/round3/challenge/${teamId}`);
        const challengeData = await challengeRes.json();

        if (!challengeRes.ok) {
          throw new Error(challengeData.message || 'Failed to load challenge');
        }

        setSector(challengeData.data.sector);
        setUnstopLink(challengeData.data.unstopLink);
        localStorage.setItem('sector', challengeData.data.sector);

        // Fetch existing Round 3 data if any
        const round3Res = await fetch(`http://localhost:5000/api/round3/team/${teamId}`);
        const round3ResData = await round3Res.json();

        if (round3Res.ok && round3ResData.data.submitted) {
          setRound3Data(round3ResData.data);
          setIsSubmitted(true);
        }

        // Fetch team data for overall scores
        const teamRes = await fetch(`http://localhost:5000/api/teams/${teamId}`);
        const teamResData = await teamRes.json();
        
        if (teamRes.ok) {
          setTeamData(teamResData.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, navigate]);

  // Unstop links for different sectors (fallback)
  const unstopLinks = {
    'Lumina District': unstopLink || 'https://unstop.com/your-lumina-challenge',
    'HydroCore': unstopLink || 'https://unstop.com/your-hydrocore-challenge',
    'AeroHab': unstopLink || 'https://unstop.com/your-aerohab-challenge'
  };

  const getSectorDescription = (sector) => {
    const descriptions = {
      'Lumina District': {
        title: 'Smart Street Lighting System',
        failure: 'Light-sensing system misreads day as night, causing power surges',
        constraint: "Day-night cycle changes every 4 hours — sensors must adapt dynamically",
        icon: '💡'
      },
      'HydroCore': {
        title: 'Smart Water Distribution',
        failure: 'Reservoir valves malfunction due to corrupted pressure data',
        constraint: 'Gravity fluctuates — water flows unpredictably upward or sideways',
        icon: '💧'
      },
      'AeroHab': {
        title: 'Smart Atmospheric System',
        failure: 'Air-quality sensors send wrong readings and false alerts',
        constraint: 'Strong electromagnetic storms disturb communication signals',
        icon: '🌪️'
      }
    };
    return descriptions[sector] || descriptions['Lumina District'];
  };

  const sectorInfo = getSectorDescription(sector);

  // Timer
  useEffect(() => {
    if (!hasStarted || isSubmitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, isSubmitted, timeRemaining]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
      
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollable = documentHeight - windowHeight;
      const progress = (scrollTop / scrollable) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartChallenge = () => {
    setHasStarted(true);
    // Open Unstop link in new tab
    window.open(unstopLinks[sector], '_blank');
  };

  const handleSubmit = async () => {
    if (!manualTime || testCasesPassed === 0) {
      alert('Please enter the time taken and number of test cases passed!');
      return;
    }

    const timeTaken = parseInt(manualTime);
    if (timeTaken > 25 || timeTaken < 0) {
      alert('Please enter a valid time between 0 and 25 minutes!');
      return;
    }

    if (!teamId) {
      alert('Team ID not found. Please register first.');
      return;
    }

    try {
      // Submit to backend
      const res = await fetch('http://localhost:5000/api/round3/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamId,
          testCasesPassed,
          timeTaken
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit results');
      }

      // Store results from backend response
      const round3Details = {
        testCasesPassed: data.data.testCasesPassed,
        timeTaken: data.data.timeTaken,
        timeScore: data.data.timeBonus,
        totalScore: data.data.finalScore,
        awaitingVerification: data.data.awaitingVerification
      };

      setRound3Data(round3Details);
      localStorage.setItem('round3Score', data.data.finalScore);
      localStorage.setItem('round3Details', JSON.stringify(round3Details));

      setIsSubmitted(true);
      
      // Refresh team data to get updated total score
      const teamRes = await fetch(`http://localhost:5000/api/teams/${teamId}`);
      const teamResData = await teamRes.json();
      if (teamRes.ok) {
        setTeamData(teamResData.data);
      }
    } catch (err) {
      console.error('Error submitting Round 3:', err);
      alert('Failed to submit results: ' + err.message);
    }
  };

  const round3Details = isSubmitted && round3Data ? round3Data : null;

  // Show loading state
  if (loading) {
    return (
      <div className="round3-container">
        <div className="round3-header">
          <h1>🧠 ROUND 3: NEURAL LOGIC</h1>
          <p className="round3-subtitle">Loading...</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          <div className="loading-spinner" style={{ fontSize: '2rem' }}>⚙️</div>
          <p>Loading challenge data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="round3-container">
        <div className="round3-header">
          <h1>🧠 ROUND 3: NEURAL LOGIC</h1>
          <p className="round3-subtitle" style={{ color: '#ff6b6b' }}>Error</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: '#ff6b6b' }}>Failed to Load Challenge</h3>
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
    <div className="round3-container">
      {/* Scroll Progress Bar */}
      <div className="scroll-progress-container">
        <motion.div 
          className="scroll-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="round3-header">
        <motion.div 
          className="round3-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>🧠 ROUND 3: NEURAL LOGIC</h1>
          <p className="round3-subtitle">Debug & Restore the Core</p>
        </motion.div>

        <div className="round3-info">
          <div className="info-card">
            <span className="info-label">Team ID:</span>
            <span className="info-value">{teamId}</span>
          </div>
          <div className="info-card">
            <span className="info-label">Sector:</span>
            <span className="info-value">{sector}</span>
          </div>
          {hasStarted && !isSubmitted && (
            <div className={`info-card timer ${timeRemaining < 300 ? 'warning' : ''}`}>
              <span className="info-label">⏱️ Time:</span>
              <span className="info-value">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
      </div>

      {!hasStarted ? (
        <motion.div 
          className="round3-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Mission Brief */}
          <motion.div 
            className="mission-brief"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2>🎯 Mission Brief</h2>
            <div className="sector-card">
              <div className="sector-icon">{sectorInfo.icon}</div>
              <h3>{sectorInfo.title}</h3>
              <div className="sector-details">
                <div className="detail-item">
                  <span className="detail-label">System Failure:</span>
                  <p>{sectorInfo.failure}</p>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Universe Constraint:</span>
                  <p>{sectorInfo.constraint}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div 
            className="instructions-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3>📋 Your Mission</h3>
            <ul>
              <li>Debug a corrupted C program that controls your sector's IoT system</li>
              <li>Fix compilation errors (syntax, headers, variable declarations)</li>
              <li>Correct logical errors (operators, conditions, data types)</li>
              <li>Ensure the program passes all test cases</li>
              <li>Complete the challenge within <strong>25 minutes</strong></li>
            </ul>

            <div className="scoring-info">
              <h4>💯 Scoring</h4>
              <div className="score-formula">
                <div className="formula-item">
                  <span className="formula-label">Test Cases Passed:</span>
                  <span className="formula-value">N points</span>
                </div>
                <div className="formula-item">
                  <span className="formula-label">Time Bonus:</span>
                  <span className="formula-value">25 - minutes taken</span>
                </div>
                <div className="formula-total">
                  <span>Total Score = Test Cases + Time Bonus</span>
                </div>
              </div>
            </div>

            <div className="warning-box">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>You'll be redirected to Unstop to complete the challenge</li>
                <li>Keep track of your time and test cases passed</li>
                <li>Return here after completing to submit your results</li>
                <li>Timer will start when you click "Launch Challenge"</li>
              </ul>
            </div>
          </motion.div>

          {/* Launch Button */}
          <motion.div 
            className="launch-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button className="launch-btn" onClick={handleStartChallenge}>
              <span className="btn-icon">🚀</span>
              Launch Challenge on Unstop
            </button>
            <p className="launch-note">
              This will open the challenge in a new tab and start your timer
            </p>
          </motion.div>
        </motion.div>
      ) : !isSubmitted ? (
        <motion.div 
          className="challenge-active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="active-header">
            <h2>Challenge In Progress</h2>
            <p>Complete the challenge on Unstop and return here to submit your results</p>
          </div>

          <div className="submission-panel">
            <h3>📊 Submit Your Results</h3>
            
            <div className="input-group">
              <label>Number of Test Cases Passed:</label>
              <input 
                type="number" 
                min="0" 
                max="10"
                value={testCasesPassed}
                onChange={(e) => setTestCasesPassed(parseInt(e.target.value) || 0)}
                placeholder="Enter number (0-10)"
              />
            </div>

            <div className="input-group">
              <label>Time Taken (in minutes):</label>
              <input 
                type="number" 
                min="0" 
                max="25"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                placeholder="Enter time (0-25 min)"
              />
            </div>

            <div className="score-preview">
              {testCasesPassed > 0 && manualTime && (
                <>
                  <div className="preview-item">
                    <span>Test Cases Score:</span>
                    <span className="preview-value">{testCasesPassed}</span>
                  </div>
                  <div className="preview-item">
                    <span>Time Bonus:</span>
                    <span className="preview-value">
                      {Math.max(0, 25 - parseInt(manualTime || 0))}
                    </span>
                  </div>
                  <div className="preview-total">
                    <span>Estimated Total:</span>
                    <span className="preview-value">
                      {testCasesPassed + Math.max(0, 25 - parseInt(manualTime || 0))}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button className="submit-btn" onClick={handleSubmit}>
              Submit Results
            </button>

            <div className="unstop-link-section">
              <p>Need to return to the challenge?</p>
              <a 
                href={unstopLinks[sector]} 
                target="_blank" 
                rel="noopener noreferrer"
                className="unstop-link"
              >
                Reopen Unstop Challenge →
              </a>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="results-panel"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2>🎉 Round 3 Complete!</h2>
          
          <div className="score-breakdown">
            <div className="score-item">
              <span>Test Cases Passed:</span>
              <span className="score-value">
                <strong>+{round3Details.testCasesPassed}</strong>
              </span>
            </div>
            <div className="score-item">
              <span>Time Taken:</span>
              <span className="score-value">
                {round3Details.timeTaken} min → <strong>+{round3Details.timeScore}</strong>
              </span>
            </div>
            <div className="score-total">
              <span>Total Round 3 Score:</span>
              <span className="total-value">{round3Details.totalScore}</span>
            </div>
          </div>

          <div className="final-summary">
            <h3>📈 Overall Performance</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <span className="summary-label">Round 1</span>
                <span className="summary-score">
                  ₹{teamData?.round1?.finalScore || localStorage.getItem('round1Score') || '0'}
                </span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Round 2</span>
                <span className="summary-score">
                  {teamData?.round2?.finalScore || localStorage.getItem('round2Score') || '0'}
                </span>
              </div>
              <div className="summary-card highlight">
                <span className="summary-label">Round 3</span>
                <span className="summary-score">
                  {round3Details?.totalScore || '0'}
                </span>
              </div>
            </div>

            <div className="total-score-display">
              <h4>🏆 Total Score</h4>
              <div className="total-score-value">
                {teamData?.totalScore || 'Calculating...'}
              </div>
              {round3Details?.awaitingVerification && (
                <p className="verification-note">
                  ⏳ Round 3 awaiting admin verification
                </p>
              )}
            </div>

            <div className="completion-message">
              <h3>🎊 Congratulations!</h3>
              <p>You have successfully completed all three rounds of TechSymphony!</p>
              <p className="final-note">
                Your scores have been recorded. Winners will be announced shortly.
              </p>
            </div>
          </div>

          <button 
            className="home-btn"
            onClick={() => window.location.href = '/'}
          >
            Return to Home
          </button>
        </motion.div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          className="scroll-to-top"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ↑
        </motion.button>
      )}
    </div>
  );
};

export default Round3;
