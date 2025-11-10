import Team from '../models/Team.js';

// Unstop challenge links for each sector
const UNSTOP_LINKS = {
  'Lumina District': 'https://unstop.com/p/to-debug-the-iot-system-and-save-neurovia-national-institute-of-engineering-nie-mysuru-1592775',
  'HydroCore': 'https://unstop.com/o/KREo3bx?lb=eK9uwefu&utm_medium=Share&utm_source=shreypv29338&utm_campaign=Online_coding_challenge',
 
};

// @desc    Get Unstop challenge link for team's sector
// @route   GET /api/round3/challenge/:teamId
// @access  Public
export const getChallengeLink = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if team completed Round 2
    if (!team.round2.submitted) {
      return res.status(400).json({
        success: false,
        message: 'Team must complete Round 2 first'
      });
    }

    const unstopLink = UNSTOP_LINKS[team.sector];

    res.status(200).json({
      success: true,
      data: {
        sector: team.sector,
        unstopLink,
        timeLimit: 30 // minutes
      }
    });
  } catch (error) {
    console.error('Get challenge link error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching challenge link'
    });
  }
};

// @desc    Submit Round 3 results
// @route   POST /api/round3/submit
// @access  Public
export const submitRound3 = async (req, res) => {
  try {
    const { teamId, testCasesPassed, timeTaken } = req.body;

    if (!teamId || testCasesPassed === undefined || timeTaken === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Team ID, test cases passed, and time taken are required'
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if team completed Round 2
    if (!team.round2.submitted) {
      return res.status(400).json({
        success: false,
        message: 'Team must complete Round 2 first'
      });
    }

    // Validate input ranges
    if (testCasesPassed < 0 || testCasesPassed > 10) {
      return res.status(400).json({
        success: false,
        message: 'Test cases passed must be between 0 and 10'
      });
    }

    if (timeTaken < 0 || timeTaken > 30) {
      return res.status(400).json({
        success: false,
        message: 'Time taken must be between 0 and 25 minutes'
      });
    }

    // Calculate score
    // Formula: testCasesPassed + (25 - timeTaken)
    const timeBonus = Math.max(0, 30 - timeTaken);
    const finalScore = testCasesPassed + timeBonus;

    // Update team Round 3 data
    team.round3.unstopLink = UNSTOP_LINKS[team.sector];
    team.round3.testCasesPassed = 100*testCasesPassed;
    team.round3.timeTaken = timeTaken;
    team.round3.finalScore = finalScore;
    team.round3.submitted = true;
    team.round3.submittedAt = new Date();
    team.round3.adminVerified = false; // Requires admin verification

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Round 3 results submitted successfully',
      data: {
        testCasesPassed,
        timeTaken,
        timeBonus,
        finalScore,
        totalScore: team.totalScore,
        awaitingVerification: true
      }
    });
  } catch (error) {
    console.error('Submit Round 3 error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting Round 3 results'
    });
  }
};

// @desc    Get team's Round 3 data
// @route   GET /api/round3/team/:teamId
// @access  Public
export const getRound3Data = async (req, res) => {
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
      data: team.round3
    });
  } catch (error) {
    console.error('Get Round 3 data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching Round 3 data'
    });
  }
};

// @desc    Admin: Verify Round 3 submission
// @route   PUT /api/round3/verify/:teamId
// @access  Private/Admin
export const verifyRound3 = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { verified, adjustedScore } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (!team.round3.submitted) {
      return res.status(400).json({
        success: false,
        message: 'Team has not submitted Round 3 yet'
      });
    }

    team.round3.adminVerified = verified;
    
    // Admin can adjust score if needed
    if (adjustedScore !== undefined) {
      team.round3.finalScore = adjustedScore;
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: `Round 3 ${verified ? 'verified' : 'unverified'} successfully`,
      data: {
        teamName: team.teamName,
        verified: team.round3.adminVerified,
        finalScore: team.round3.finalScore,
        totalScore: team.totalScore
      }
    });
  } catch (error) {
    console.error('Verify Round 3 error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error verifying Round 3'
    });
  }
};
