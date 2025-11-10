import Team from '../models/Team.js';

// @desc    Register a new team
// @route   POST /api/teams/register
// @access  Public
export const registerTeam = async (req, res) => {
  try {
    const { teamName, members } = req.body;

    // Validation
    if (!teamName || !members || members.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Team must have a name and at least 1 member'
      });
    }

    // Validate member names
    const nameRegex = /^[a-zA-Z\s]+$/;  // Only letters and spaces
    for (const member of members) {
      if (!member.name || member.name.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Each member name must be at least 3 characters long'
        });
      }
      if (!nameRegex.test(member.name.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Member names can only contain letters and spaces (no numbers)'
        });
      }
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team name already exists'
      });
    }

    // Calculate total fee
    
    
    

    // Assign sector randomly
    const sectors = ['Lumina District', 'HydroCore'];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];

    // Create team
    const team = await Team.create({
      teamName,
      members,
      sector
     
    });

    res.status(201).json({
      success: true,
      message: 'Team registered successfully',
      data: {
        teamId: team._id,
        teamName: team.teamName,
        sector: team.sector,
       
        memberCount: team.members.length
      }
    });
  } catch (error) {
    console.error('Register team error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering team'
    });
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Public
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching team'
    });
  }
};

// @desc    Get team by name
// @route   GET /api/teams/name/:teamName
// @access  Public
export const getTeamByName = async (req, res) => {
  try {
    const team = await Team.findOne({ teamName: req.params.teamName });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team by name error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching team'
    });
  }
};

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public
export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({}).sort({ totalScore: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching teams'
    });
  }
};
