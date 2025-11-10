import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Component type is required'],
    enum: ['light-sensor', 'pressure-sensor', 'signal', 'controller', 'communication', 'cloud', 'led-actuator', 'pump-actuator', 'other']
  },
  icon: {
    type: String,
    default: '📦'
  },
  description: {
    type: String,
    required: [true, 'Component description is required']
  },
  price: {
    type: Number,
    required: [true, 'Component price is required'],
    min: [0, 'Price cannot be negative']
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['essential', 'optional'],
    default: 'optional'
  }
}, {
  timestamps: true
});

// Index for faster queries
componentSchema.index({ type: 1 });
componentSchema.index({ price: 1 });
componentSchema.index({ isAvailable: 1 });

const Component = mongoose.model('Component', componentSchema);

export default Component;
