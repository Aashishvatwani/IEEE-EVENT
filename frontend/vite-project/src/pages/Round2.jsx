import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Round2.css';

const Round2 = () => {
  const navigate = useNavigate();
  const [teamId] = useState(localStorage.getItem('teamId') || null);
  const [sector, setSector] = useState(localStorage.getItem('sector') || null);
  const [purchasedComponents, setPurchasedComponents] = useState(() => {
    const saved = localStorage.getItem('round2PurchasedComponents');
    return saved ? JSON.parse(saved) : [];
  });
  const [schematicSlots, setSchematicSlots] = useState(() => {
    const saved = localStorage.getItem('round2SchematicSlots');
    return saved ? JSON.parse(saved) : [
      { id: 1, label: 'Input Layer', component: null, correctType: 'sensor' },
      { id: 2, label: 'Signal Processing', component: null, correctType: 'signal' },
      { id: 3, label: 'Control Unit', component: null, correctType: 'controller' },
      { id: 4, label: 'Communication', component: null, correctType: 'communication' },
      { id: 5, label: 'Data Storage', component: null, correctType: 'cloud' },
      { id: 6, label: 'Output Layer', component: null, correctType: 'actuator' }
    ];
  });
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const saved = localStorage.getItem('round2TimeRemaining');
    return saved ? parseInt(saved) : 20 * 60;
  });
  const [isSubmitted, setIsSubmitted] = useState(() => {
    const saved = localStorage.getItem('round2IsSubmitted');
    return saved === 'true';
  });
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem('round2Score');
    return saved ? parseInt(saved) : null;
  });
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [showHint, setShowHint] = useState(() => {
    const saved = localStorage.getItem('round2ShowHint');
    return saved === 'true';
  });
  const [availableComponents, setAvailableComponents] = useState([]);
  const [remainingBalance, setRemainingBalance] = useState(() => {
    const saved = localStorage.getItem('round2RemainingBalance');
    return saved ? parseInt(saved) : 0;
  });
  const [showComponentStore, setShowComponentStore] = useState(false);
  const [selectedComponentToBuy, setSelectedComponentToBuy] = useState(null);

  // Save additional state to localStorage
  useEffect(() => {
    localStorage.setItem('round2RemainingBalance', remainingBalance.toString());
  }, [remainingBalance]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (purchasedComponents.length > 0) {
      localStorage.setItem('round2PurchasedComponents', JSON.stringify(purchasedComponents));
    }
  }, [purchasedComponents]);

  useEffect(() => {
    localStorage.setItem('round2SchematicSlots', JSON.stringify(schematicSlots));
  }, [schematicSlots]);

  useEffect(() => {
    localStorage.setItem('round2TimeRemaining', timeRemaining.toString());
  }, [timeRemaining]);

  useEffect(() => {
    localStorage.setItem('round2IsSubmitted', isSubmitted.toString());
  }, [isSubmitted]);

  useEffect(() => {
    if (score !== null) {
      localStorage.setItem('round2Score', score.toString());
    }
  }, [score]);

  useEffect(() => {
    localStorage.setItem('round2ShowHint', showHint.toString());
  }, [showHint]);

  // Fetch team data and purchased components from backend
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

        // Fetch team data to get purchased components from Round 1
        const teamRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${teamId}`);
        const teamData = await teamRes.json();

        if (!teamRes.ok) {
          throw new Error(teamData.message || 'Failed to load team data');
        }

        setTeamData(teamData.data);
        setSector(teamData.data.sector);

        // Check if Round 1 completed
        if (!teamData.data.round1.submitted) {
          setError('Please complete Round 1 first before accessing Round 2.');
          setLoading(false);
          return;
        }

        // Extract purchased components from Round 1
        const components = teamData.data.round1.purchasedComponents || [];
        
        if (components.length === 0) {
          setError('No components found from Round 1. Please complete Round 1 first.');
          setLoading(false);
          return;
        }

        // Transform components to match frontend format
        const transformedComponents = components.map((c, index) => ({
          code: c.componentId,
          name: c.name,
          type: c.type,
          icon: getIconForType(c.type),
          price: c.price
        }));

        setPurchasedComponents(transformedComponents);

        // Get remaining balance from Round 1
        const balance = teamData.data.round1.totalBalance || 0;
        setRemainingBalance(balance);

        // Fetch all available components for additional purchase
        const componentsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round1/components`);
        const componentsData = await componentsRes.json();
        
        if (componentsRes.ok) {
          const allComponents = componentsData.data.map(c => ({
            code: c._id,
            name: c.name,
            type: c.type,
            icon: getIconForType(c.type),
            price: c.price,
            description: c.description
          }));
          
          // Filter out already purchased components
          const purchasedIds = transformedComponents.map(c => c.code);
          const available = allComponents.filter(c => !purchasedIds.includes(c.code));
          setAvailableComponents(available);
        }

        // Check if Round 2 already submitted
        if (teamData.data.round2.submitted) {
          // Load existing submission
          const round2Data = teamData.data.round2;
          setIsSubmitted(true);
          setScore({
            placementScore: round2Data.correctPlacements * 5,
            timeScore: Math.max(0, 20 - round2Data.timeTaken),
            penalty: round2Data.penalties,
            totalScore: round2Data.finalScore,
            correctPlacements: round2Data.correctPlacements,
            missingComponents: 6 - round2Data.correctPlacements,
            wrongComponents: 0,
            timeTaken: round2Data.timeTaken
          });

          // Reconstruct schematic from saved data
          if (round2Data.schematic && round2Data.schematic.length === 6) {
            setSchematicSlots(prev => prev.map((slot, index) => ({
              ...slot,
              component: round2Data.schematic[index] ? {
                name: round2Data.schematic[index].componentName,
                type: round2Data.schematic[index].componentType,
                icon: getIconForType(round2Data.schematic[index].componentType)
              } : null
            })));
          }
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

  // Helper function to get icon for component type
  const getIconForType = (type) => {
    const icons = {
      sensor: '📡',
      signal: '⚡',
      controller: '🧠',
      communication: '📶',
      cloud: '☁️',
      actuator: '🔧'
    };
    return icons[type] || '📦';
  };

  // Correct component flow
  
  // Timer
  useEffect(() => {
    if (isSubmitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        // Show hint after 10 minutes (when 10 minutes remain)
        if (prev === 10 * 60 && !showHint) {
          setShowHint(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted, showHint]);

  // Scroll to top handler
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
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

  const handleDragStart = (component) => {
    setDraggedComponent(component);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (slotId) => {
    if (!draggedComponent) return;

    setSchematicSlots(prev =>
      prev.map(slot =>
        slot.id === slotId
          ? { ...slot, component: draggedComponent }
          : slot
      )
    );
    setDraggedComponent(null);
  };

  const handleRemoveComponent = (slotId) => {
    setSchematicSlots(prev =>
      prev.map(slot =>
        slot.id === slotId
          ? { ...slot, component: null }
          : slot
      )
    );
  };

  const calculateScore = () => {
    let correctPlacements = 0;
    let missingComponents = 0;
    let wrongComponents = 0;

    schematicSlots.forEach(slot => {
      if (!slot.component) {
        missingComponents++;
      } else if (slot.component.type === slot.correctType) {
        correctPlacements++;
      } else {
        wrongComponents++;
      }
    });

    const placementScore = correctPlacements * 5;
    const timeTaken = Math.ceil((20 * 60 - timeRemaining) / 60);
    const timeScore = Math.max(0, 20 - timeTaken);
    const penalty = (missingComponents + wrongComponents) * 5;

    const totalScore = Math.max(0, placementScore + timeScore - penalty);

    return {
      placementScore,
      timeScore,
      penalty,
      totalScore,
      correctPlacements,
      missingComponents,
      wrongComponents,
      timeTaken
    };
  };

  const handleAutoSubmit = async () => {
    if (!teamId) {
      alert('Team ID not found. Please register first.');
      return;
    }

    // Count filled slots
    const filledSlots = schematicSlots.filter(slot => slot.component !== null).length;
    
    // Check if at least some components are placed
    if (filledSlots === 0) {
      alert('Please place at least one component before submitting!');
      return;
    }

    try {
      const timeTaken = Math.ceil((20 * 60 - timeRemaining) / 60);

      // Prepare schematic data for backend
      const schematic = schematicSlots.map(slot => ({
        componentId: slot.component?.code || null,
        componentName: slot.component?.name || null,
        componentType: slot.component?.type || null
      }));

      // Submit to backend
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round2/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamId,
          schematic,
          timeTaken
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit schematic');
      }

      // Save score and submission status
      setScore({
        totalScore: data.data.finalScore,
        correctPlacements: data.data.correctPlacements,
        timeTaken: data.data.timeTaken,
        timeBonus: data.data.timeBonus || 0,
        filledSlots: filledSlots
      });
      setIsSubmitted(true);
      
      // Store data
      localStorage.setItem('round2Score', data.data.finalScore.toString());
      localStorage.setItem('round2IsSubmitted', 'true');
      
      // Create detailed result message
      let resultMessage = '';
      if (data.data.isAllCorrect) {
        resultMessage = `Perfect! All components are correctly arranged!\n\n`;
      } else {
        resultMessage = `Schematic submitted!\n${data.data.correctPlacements} out of ${filledSlots} placed components are correct.\n\n`;
      }
      
      resultMessage += `Placement Score: ${data.data.correctPlacements} × 15 = ${data.data.correctPlacements * 15} pts\n`;
      
      if (data.data.correctPlacements > 0) {
        resultMessage += `Time Bonus: +${data.data.timeBonus || 0} pts\n`;
      } else {
        resultMessage += `Time Bonus: 0 pts (need at least 1 correct component)\n`;
      }
      
      resultMessage += `\nTotal Score: ${data.data.finalScore} / 100\n\nProceeding to Round 3...`;
      
      alert(resultMessage);
      
      // Proceed to Round 3 after showing results
      setTimeout(() => {
        navigate('/round3');
      }, 3000);

    } catch (err) {
      console.error('Error submitting schematic:', err);
      alert('Failed to submit schematic: ' + err.message);
    }
  };

  const handleSubmit = () => {
    // Count filled slots
    const filledSlots = schematicSlots.filter(slot => slot.component !== null).length;
    
    if (filledSlots === 0) {
      alert('Please place at least one component before submitting!');
      return;
    }

    // Warn if not all slots are filled
    if (filledSlots < 6) {
      const proceed = window.confirm(
        `You have only filled ${filledSlots} out of 6 slots.\n` +
        `Empty slots will count as incorrect.\n\n` +
        `Do you want to submit anyway and proceed to Round 3?`
      );
      if (!proceed) return;
    }
    
    handleAutoSubmit();
  };

  const handleBuyComponent = async (component) => {
    if (remainingBalance < component.price) {
      alert(`Insufficient balance! You have ₹${remainingBalance} but need ₹${component.price}`);
      return;
    }

    if (window.confirm(`Buy ${component.name} for ₹${component.price}?`)) {
      try {
        // Add component to purchased list
        const newComponent = {
          code: component.code,
          name: component.name,
          type: component.type,
          icon: component.icon,
          price: component.price
        };

        setPurchasedComponents(prev => [...prev, newComponent]);
        setRemainingBalance(prev => prev - component.price);
        
        // Remove from available components
        setAvailableComponents(prev => prev.filter(c => c.code !== component.code));
        
        alert(`Successfully purchased ${component.name}!`);
        setShowComponentStore(false);
        setSelectedComponentToBuy(null);
      } catch (err) {
        console.error('Error purchasing component:', err);
        alert('Failed to purchase component: ' + err.message);
      }
    }
  };

  const isAllSlotsValid = schematicSlots.every(slot => slot.component !== null);

  // Show loading state
  if (loading) {
    return (
      <div className="round2-container">
        <div className="round2-header">
          <h1>⚙️ ROUND 2: SYSTEM GENESIS</h1>
          <p className="round2-subtitle">Loading...</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          <div className="loading-spinner" style={{ fontSize: '2rem' }}>⚙️</div>
          <p>Loading your components...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="round2-container">
        <div className="round2-header">
          <h1>⚙️ ROUND 2: SYSTEM GENESIS</h1>
          <p className="round2-subtitle" style={{ color: '#ff6b6b' }}>Error</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: '#ff6b6b' }}>Failed to Load Round 2</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.href = '/round1'} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', marginRight: '0.5rem' }}
          >
            Go to Round 1
          </button>
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
    <div className="round2-container">
      <div className="round2-header">
        <motion.div 
          className="round2-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>⚙️ ROUND 2: SYSTEM GENESIS</h1>
          <p className="round2-subtitle">Map the IoT Data Flow</p>
        </motion.div>

        <div className="round2-info">
          <div className="info-card">
            <span className="info-label">Team ID:</span>
            <span className="info-value">{teamId}</span>
          </div>
          <div className="info-card">
            <span className="info-label">Sector:</span>
            <span className="info-value">{sector}</span>
          </div>
          <div className={`info-card timer ${timeRemaining < 300 ? 'warning' : ''}`}>
            <span className="info-label">⏱️ Time:</span>
            <span className="info-value">{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>

      {!isSubmitted ? (
        <div className="round2-content">
          {/* Instructions */}
          <motion.div 
            className="instructions-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3>📋 Instructions</h3>
            <ul>
              <li>Drag and drop your purchased components into the schematic slots</li>
              <li>Build the correct IoT data flow from input to output</li>
              <li>Each correct placement earns <strong>15 points</strong> (max 90 points)</li>
              <li>Time bonus: Up to <strong>10 points</strong> (requires at least 1 correct component)</li>
              <li><strong>You can submit with partial completion!</strong> Empty slots won't earn points.</li>
              <li>You can purchase more components if you have remaining balance</li>
              <li>Complete within 20 minutes</li>
            </ul>
            
          </motion.div>

          {/* Component Palette */}
          <motion.div 
            className="component-palette"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="palette-header">
              <h3>🧩 Your Components</h3>
              <div className="balance-info">
                <span className="balance-label">Balance:</span>
                <span className="balance-amount">₹{remainingBalance}</span>
              </div>
            </div>
            
            {/* Buy More Components Button */}
            {remainingBalance > 0 && availableComponents.length > 0 && (
              <div className="buy-more-section">
                <button 
                  className="buy-more-btn"
                  onClick={() => setShowComponentStore(!showComponentStore)}
                >
                  {showComponentStore ? '🔼 Hide Component Store' : '🛒 Buy More Components'}
                </button>
              </div>
            )}

            {/* Component Store Dropdown */}
            {showComponentStore && (
              <motion.div 
                className="component-store-dropdown"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h4>💰 Available Components to Purchase</h4>
                <div className="store-grid">
                  {availableComponents
                    .filter(c => c.price <= remainingBalance)
                    .map((component, index) => (
                      <div key={index} className={`store-component ${component.type}`}>
                        <div className="component-icon">{component.icon}</div>
                        <div className="component-name">{component.name}</div>
                        <div className="component-type">{component.type}</div>
                        <div className="component-price">₹{component.price}</div>
                        <button 
                          className="buy-btn"
                          onClick={() => handleBuyComponent(component)}
                        >
                          Purchase
                        </button>
                      </div>
                    ))}
                  {availableComponents.filter(c => c.price <= remainingBalance).length === 0 && (
                    <div className="no-affordable">
                      <p>⚠️ No components available within your budget</p>
                      <p className="hint">Current balance: ₹{remainingBalance}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <div className="palette-grid">
              {purchasedComponents.length === 0 ? (
                <div className="no-components">
                  <p>⚠️ No components purchased in Round 1</p>
                  <p className="hint">You need 6 components to complete the schematic</p>
                </div>
              ) : (
                purchasedComponents.map((component, index) => (
                  <motion.div
                    key={index}
                    className={`palette-component ${component.type}`}
                    draggable
                    onDragStart={() => handleDragStart(component)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="component-icon">{component.icon}</div>
                    <div className="component-name">{component.name}</div>
                    <div className="component-type">{component.type}</div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Schematic Builder */}
          <motion.div 
            className="schematic-builder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3>🔧 IoT System Schematic</h3>

            {/* Hint - Appears after 10 minutes */}
            {showHint && (
              <motion.div 
                className="schematic-hint"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="hint-header">
                  <span className="hint-icon">💡</span>
                  <span className="hint-title">Component Flow Hint</span>
                </div>
                <div className="hint-content">
                  <div className="hint-flow">
                    <span className="hint-step">Sensor</span>
                    <span className="hint-arrow">→</span>
                    <span className="hint-step">Signal</span>
                    <span className="hint-arrow">→</span>
                    <span className="hint-step">Controller</span>
                    <span className="hint-arrow">→</span>
                    <span className="hint-step">Communication</span>
                    <span className="hint-arrow">→</span>
                    <span className="hint-step">Cloud</span>
                    <span className="hint-arrow">→</span>
                    <span className="hint-step">Actuator</span>
                  </div>
                  <p className="hint-note">
                    💡 Arrange your components in the correct order to proceed!
                  </p>
                </div>
              </motion.div>
            )}

            <div className="schematic-flow">
              {schematicSlots.map((slot, index) => {
                // Check if component is correctly placed
                const isCorrect = slot.component && slot.component.type === slot.correctType;
                const isIncorrect = slot.component && slot.component.type !== slot.correctType;
                
                return (
                  <div key={slot.id} className="slot-container">
                    <motion.div
                      className={`schematic-slot ${slot.component ? 'filled' : 'empty'} ${isCorrect ? 'correct-placement' : ''} ${isIncorrect ? 'incorrect-placement' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(slot.id)}
                      whileHover={{ scale: slot.component ? 1 : 1.02 }}
                    >
                      <div className="slot-label">{slot.label}</div>
                      {slot.component ? (
                        <div className={`placed-component ${slot.component.type}`}>
                          <div className="component-icon">{slot.component.icon}</div>
                          <div className="component-name">{slot.component.name}</div>
                          {isCorrect && <div className="validity-indicator correct">✓</div>}
                          {isIncorrect && <div className="validity-indicator incorrect">✗</div>}
                          <button 
                            className="remove-btn"
                            onClick={() => handleRemoveComponent(slot.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="empty-slot-placeholder">
                          Drop component here
                        </div>
                      )}
                    </motion.div>
                    {index < schematicSlots.length - 1 && (
                      <div className="flow-arrow">→</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="submit-section">
              {(() => {
                const filledSlots = schematicSlots.filter(slot => slot.component !== null).length;
                const hasComponents = filledSlots > 0;
                
                return (
                  <>
                    <button 
                      className={`submit-btn ${hasComponents ? 'ready' : 'disabled'}`}
                      onClick={handleSubmit}
                      disabled={!hasComponents}
                    >
                      {hasComponents 
                        ? `🎯 Submit & Proceed (${filledSlots}/6 filled)` 
                        : '⚠ Place at least 1 component'}
                    </button>
                    <p className="submit-hint">
                      {filledSlots === 6 
                        ? 'All slots filled! Submit to proceed to Round 3.'
                        : filledSlots > 0
                        ? `${filledSlots}/6 slots filled. You can submit now, but empty slots count as incorrect.`
                        : 'Place components in the slots above, then submit to proceed.'}
                    </p>
                  </>
                );
              })()}
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div 
          className="results-panel"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2>📊 Round 2 Results</h2>
          <div className="score-breakdown">
            <div className="score-item">
              <span>Components Placed:</span>
              <span className="score-value">
                <strong>{score.filledSlots || 0} / 6 slots</strong>
              </span>
            </div>
            <div className="score-item">
              <span>Correct Placements:</span>
              <span className="score-value">
                {score.correctPlacements} × 15 pts = <strong>+{score.correctPlacements * 15}</strong>
              </span>
            </div>
            <div className="score-item">
              <span>Time Bonus:</span>
              <span className="score-value">
                {score.timeTaken} min → <strong>+{score.timeBonus || 0} pts</strong>
              </span>
            </div>
            <div className="score-total">
              <span>Total Round 2 Score:</span>
              <span className="total-value">{score.totalScore} / 100</span>
            </div>
          </div>

          <div className="schematic-review">
            <h3>Your Schematic:</h3>
            <div className="review-flow">
              {schematicSlots.map((slot, index) => (
                <div key={slot.id} className="review-slot">
                  <div className={`review-component ${
                    slot.component?.type === slot.correctType ? 'correct' : 'incorrect'
                  }`}>
                    <div className="component-icon">
                      {slot.component ? slot.component.icon : '❌'}
                    </div>
                    <div className="component-name">
                      {slot.component ? slot.component.name : 'Empty Slot'}
                    </div>
                    <div className="validation-status">
                      {slot.component 
                        ? (slot.component.type === slot.correctType ? '✓ Correct' : '✗ Wrong Position')
                        : '⚠ Not Filled'}
                    </div>
                  </div>
                  {index < schematicSlots.length - 1 && <span className="flow-arrow">→</span>}
                </div>
              ))}
            </div>
          </div>

          <button 
            className="next-round-btn"
            onClick={() => navigate('/round3')}
          >
            Proceed to Round 3: Neural Logic →
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

export default Round2;
