import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './TeamRegistration.css'

export default function TeamRegistration() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    teamName: '',
    // Start with one member; users can add as many as they want
    members: [
      { name: '', email: '' }
    ]
  })

  const [submitted, setSubmitted] = useState(false)
  const [registrationData, setRegistrationData] = useState(null)
  const [errors, setErrors] = useState({})

  const handleTeamChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...formData.members]
    newMembers[index][field] = value
    setFormData({
      ...formData,
      members: newMembers
    })
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.teamName.trim()) {
      newErrors.teamName = 'Team name is required'
    }

    // At least 1 member required (min 1), no hard maximum
    const filledMembers = formData.members.filter(m => m.name.trim() && m.email.trim())
    if (filledMembers.length < 1) {
      newErrors.members = 'At least 1 team member required'
    }

    // Validate member names and emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const nameRegex = /^[a-zA-Z\s]+$/  // Only letters and spaces, no numbers
    
    formData.members.forEach((member, idx) => {
      // If the member has any data, validate both name and email
      if (member.name.trim() || member.email.trim()) {
        // Validate name: must be at least 3 characters and contain only letters
        if (member.name.trim()) {
          if (member.name.trim().length < 3) {
            newErrors[`name${idx}`] = 'Name must be at least 3 characters'
          } else if (!nameRegex.test(member.name.trim())) {
            newErrors[`name${idx}`] = 'Name can only contain letters and spaces'
          }
        }
        
        // Validate email format
        if (!emailRegex.test(member.email)) {
          newErrors[`email${idx}`] = 'Invalid email format'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Filter out empty members
      const finalData = {
        ...formData,
        members: formData.members.filter(m => m.name.trim() && m.email.trim())
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(finalData)
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          console.error('Server error:', errData)
          setErrors(prev => ({ 
            ...prev, 
            submit: errData.message || 'Failed to register team. Please try again.' 
          }))
          return
        }

        const data = await res.json()
        console.log('Team Registration Response:', data)

        // Save team ID, sector, and team name to localStorage for rounds
        if (data.data && data.data.teamId) {
          localStorage.setItem('teamId', data.data.teamId);
        }
        if (data.data && data.data.sector) {
          localStorage.setItem('sector', data.data.sector);
        }
        if (data.data && data.data.teamName) {
          localStorage.setItem('teamName', data.data.teamName);
        }

        setRegistrationData(data.data)
        setSubmitted(true)

        // Redirect to Round 1 after 3 seconds
        setTimeout(() => {
          navigate('/round1')
        }, 3000)

      } catch (error) {
        console.error('Network error:', error)
        setErrors(prev => ({ ...prev, submit: 'Network error. Please check your connection.' }))
      }
    }
  }

  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, { name: '', email: '' }]
    }))
  }

  const removeMember = (index) => {
    setFormData(prev => {
      if (prev.members.length <= 1) return prev // keep at least one
      const updated = [...prev.members]
      updated.splice(index, 1)
      return { ...prev, members: updated }
    })
  }

  const calculateEntryFee = () => {
    const filledMembers = formData.members.filter(m => m.name.trim())
    return filledMembers.length * 20 // Example: ₹20 per member
  }

  return (
    <div className="team-registration">
      {/* Background Effects */}
      <div className="registration-bg">
        <div className="scan-line"></div>
        <div className="grid-overlay"></div>
      </div>

      <motion.div 
        className="registration-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div 
          className="registration-header"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="header-glow"></div>
          <h1 className="registration-title">
            <span className="title-prefix">[SYSTEM ACCESS]</span>
            <br />
            TECH RESTORATION DIVISION
            <br />
            <span className="title-subtitle">Team Initialization Protocol</span>
          </h1>
          <p className="registration-tagline">
            Register your squad. Join the mission to restore Neurovia.
          </p>
        </motion.div>

        {/* Success Message */}
        {submitted && registrationData && (
          <motion.div 
            className="success-message"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="success-icon">✓</div>
            <h3>TEAM REGISTERED SUCCESSFULLY</h3>
            <p>Access granted. Redirecting to Round 1...</p>
            <div style={{ marginTop: '1rem', fontSize: '0.95rem', opacity: 0.9 }}>
              <p><strong>Team:</strong> {registrationData.teamName}</p>
              <p><strong>Sector Assigned:</strong> {registrationData.sector}</p>
              <p><strong>Members:</strong> {registrationData.memberCount}</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Team ID: {registrationData.teamId}
              </p>
            </div>
          </motion.div>
        )}

        {/* Registration Form */}
        <motion.form 
          className="registration-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Team Info Section */}
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon">🛡️</span>
              Team Identity
            </h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="teamName">Team Name *</label>
                <input
                  type="text"
                  id="teamName"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleTeamChange}
                  placeholder="e.g., Circuit Breakers"
                  className={errors.teamName ? 'error' : ''}
                  required
                />
                {errors.teamName && <span className="error-text">{errors.teamName}</span>}
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon">👥</span>
              Team Members (min 1 — add more as needed)
            </h2>
            {errors.members && <span className="error-text">{errors.members}</span>}

            <motion.button 
              type="button" 
              className="add-member-btn" 
              onClick={addMember}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="add-member-icon">➕</span>
              <span className="add-member-text">Add Team Member</span>
            </motion.button>

            {formData.members.map((member, index) => (
              <motion.div 
                key={index}
                className="member-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="member-header">
                  <span className="member-number">Member #{index + 1}</span>
                  {formData.members.length > 1 && (
                    <motion.button
                      type="button"
                      className="remove-member-btn"
                      onClick={() => removeMember(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="remove-icon">✕</span>
                      <span className="remove-text">Remove</span>
                    </motion.button>
                  )}
                </div>
                
                <div className="member-fields">
                  <div className="form-group">
                    <label htmlFor={`member-name-${index}`}>Full Name {index === 0 && '*'}</label>
                    <input
                      type="text"
                      id={`member-name-${index}`}
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      placeholder="Enter full name"
                      className={errors[`name${index}`] ? 'error' : ''}
                    />
                    {errors[`name${index}`] && <span className="error-text">{errors[`name${index}`]}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor={`member-email-${index}`}>Email {index === 0 && '*'}</label>
                    <input
                      type="email"
                      id={`member-email-${index}`}
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                      placeholder="email@example.com"
                      className={errors[`email${index}`] ? 'error' : ''}
                    />
                    {errors[`email${index}`] && <span className="error-text">{errors[`email${index}`]}</span>}
                  </div>

                  
                </div>
              </motion.div>
            ))}
          </div>

        
          {/* Submit Error */}
          {errors.submit && (
            <div className="error-text" style={{ marginBottom: '1rem', textAlign: 'center' }}>
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="submit-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
          >
            <span className="button-text">⚡ Initialize Team & Join Mission</span>
          </motion.button>
        </motion.form>

        {/* Event Info */}
       
      </motion.div>
    </div>
  )
}
