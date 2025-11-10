import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  
 
});

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Team name must be at least 3 characters'],
    maxlength: [50, 'Team name cannot exceed 50 characters']
  },
  members: {
    type: [memberSchema],
    validate: {
      validator: function(members) {
        return members.length >= 1 ;
      },
      message: 'Team must have at least 1 member'
    }
  },
  sector: {
    type: String,
    enum: ['Lumina District', 'HydroCore'],
    required: true
  },

  registrationDate: {
    type: Date,
    default: Date.now
  },
  // Round 1 Data
  round1: {
    quizScore: { type: Number, default: 0 },
    earnedAmount: { type: Number, default: 0 },
    totalBalance: { type: Number, default: 0 },
    purchasedComponents: [{
      componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component' },
      name: { type: String },
      type: { type: String },
      price: { type: Number },
      icon: { type: String },
      purchasedAt: { type: Date, default: Date.now }
    }],
    submitted: { type: Boolean, default: false },
    submittedAt: Date,
    finalScore: { type: Number, default: 0 }
  },
  // Round 2 Data
  round2: {
    schematic: [{
      slotIndex: { type: Number },
      componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component' },
      componentName: { type: String },
      componentType: { type: String }
    }],
    correctPlacements: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }, // in minutes
    penalties: { type: Number, default: 0 },
    submitted: { type: Boolean, default: false },
    submittedAt: Date,
    finalScore: { type: Number, default: 0 }
  },
  // Round 3 Data
  round3: {
    unstopLink: { type: String },
    testCasesPassed: { type: Number, default: 0, min: 0, max: 100 },
    timeTaken: { type: Number, default: 0, min: 0, max: 25 }, // in minutes
    submitted: { type: Boolean, default: false },
    submittedAt: Date,
    finalScore: { type: Number, default: 0 },
    adminVerified: { type: Boolean, default: false }
  },
  // Total Score
  totalScore: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
teamSchema.index({ teamName: 1 });
teamSchema.index({ totalScore: -1 });
teamSchema.index({ sector: 1 });

// Calculate total score before saving
teamSchema.pre('save', function(next) {
  this.totalScore = 
    (this.round1.finalScore || 0) + 
    (this.round2.finalScore || 0) + 
    (this.round3.finalScore || 0);
  next();
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
