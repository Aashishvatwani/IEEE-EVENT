import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Component from '../models/Component.js';
import QuizQuestion from '../models/QuizQuestion.js';
import Admin from '../models/Admin.js';

dotenv.config();

// Component data (from frontend)
const components = [
  {
    name: 'Diode',
    type: 'other',
    icon: '➡',
    description: 'Allows current to flow in one direction only, blocking reverse flow',
    price: 40,
    specifications: {
      'Forward Voltage': '0.7V (Silicon)',
      'Max Current': '1A',
      'Reverse Voltage': '50V - 1000V'
    },
    category: 'essential'
  },
  {
    name: 'Mouse',
    type: 'other',
    icon: '🖱',
    description: 'Helps in selecting and manipulating components during simulation',
    price: 30,
    specifications: {
      'Interface': 'USB/Wireless',
      'DPI': '800-3200',
      'Buttons': '3+'
    },
    category: 'essential'
  },
  {
    name: 'Communication Module',
    type: 'communication',
    icon: '📶',
    description: 'Handles data transmission between devices wirelessly or via network',
    price: 120,
    specifications: {
      'Protocol': 'WiFi/Bluetooth',
      'Range': 'Up to 100m',
      'Data Rate': '1Mbps'
    },
    category: 'essential'
  },
  {
    name: 'Resistor',
    type: 'other',
    icon: '🌀',
    description: 'Controls current flow and limits excessive voltage in circuits',
    price: 20,
    specifications: {
      'Resistance': '1Ω - 10MΩ',
      'Power Rating': '0.25W - 2W',
      'Tolerance': '±5%'
    },
    category: 'essential'
  },
  {
    name: 'Cloud / Database Storage',
    type: 'cloud',
    icon: '☁',
    description: 'Stores collected IoT data for remote access and analysis',
    price: 50,
    specifications: {
      'Storage': 'Unlimited',
      'API Access': 'REST/MQTT',
      'Latency': '<100ms'
    },
    category: 'essential'
  },
  {
    name: 'Keyboard',
    type: 'other',
    icon: '⌨',
    description: 'Used to input commands or code into the microcontroller\'s IDE',
    price: 70,
    specifications: {
      'Interface': 'USB/PS2',
      'Keys': '104 Standard',
      'Type': 'Mechanical/Membrane'
    },
    category: 'essential'
  },
  {
    name: 'Sensor',
    type: 'sensor',
    icon: '📡',
    description: 'Detects environmental changes and sends signals to the controller',
    price: 150,
    specifications: {
      'Type': 'Environmental Sensor',
      'Output': 'Analog/Digital',
      'Response Time': '<1s'
    },
    category: 'essential'
  },
  {
    name: 'Inductor',
    type: 'other',
    icon: '🌀',
    description: 'Stores energy in magnetic field and resists sudden current change',
    price: 60,
    specifications: {
      'Inductance': '1μH - 100mH',
      'Current Rating': '100mA - 5A',
      'DC Resistance': '<1Ω'
    },
    category: 'essential'
  },
  {
    name: 'Actuator',
    type: 'actuator',
    icon: '🔌',
    description: 'Performs mechanical action based on control signals',
    price: 100,
    specifications: {
      'Type': 'Electromechanical',
      'Operating Voltage': '5-12V',
      'Response Time': '<500ms'
    },
    category: 'essential'
  },
  {
    name: 'Signal Scaling',
    type: 'signal',
    icon: '⚡',
    description: 'Amplifies or scales signals to readable voltage levels',
    price: 80,
    specifications: {
      'Gain Range': '1-1000x',
      'Input Voltage': '0-5V',
      'Output Voltage': '0-5V'
    },
    category: 'essential'
  },
  {
    name: 'Controller (MCU)',
    type: 'controller',
    icon: '🧠',
    description: 'The microcontroller that processes all logic and control functions',
    price: 250,
    specifications: {
      'Architecture': '32-bit ARM',
      'Clock Speed': '80MHz',
      'GPIO Pins': '20+'
    },
    category: 'essential'
  },
  {
    name: 'Capacitor',
    type: 'other',
    icon: '💾',
    description: 'Stores and releases electrical energy, stabilizing voltage supply',
    price: 30,
    specifications: {
      'Capacitance': '1pF - 1000μF',
      'Voltage Rating': '6.3V - 50V',
      'Type': 'Ceramic/Electrolytic'
    },
    category: 'essential'
  }
];

// Quiz questions (from frontend)
const quizQuestions = [
  {
    question: 'Your autonomous robot suddenly stops moving when an obstacle appears. The microcontroller didn’t “see” the obstacle directly — something else did and alerted it. Which component made this possible?',
    options: ['Actuator', 'Controller', 'Sensor', 'Communication Module'],
    correctAnswer: 2,
    points: 100,
    category: 'iot',
    difficulty: 'easy'
  },
  {
    question: 'The temperature sensor gives a 20 mV signal, but your analog to digital converter needs at least 1 V to read it properly. Which stage in your design helps you bring this signal to a readable level without distorting it?',
    options: ['Signal Scaling', 'Amplifier', 'Resistor', 'Filter'],
    correctAnswer: 0,
    points: 100,
    category: 'electronics',
    difficulty: 'medium'
  },
  {
    question: 'I neither sense nor move, yet nothing in the system happens without my decision. I follow every instruction written in code, never questioning — only executing. Who am I?',
    options: ['Actuator', 'Controller (MCU)', 'Sensor', 'Power Supply'],
    correctAnswer: 1,
    points: 100,
    category: 'electronics',
    difficulty: 'easy'
  },
  {
    question: 'Your weather-monitoring node collects data in a remote field. It must send temperature and humidity readings wirelessly to a dashboard 2 km away. Which unit ensures that connection happens?',
    options: ['Actuator', 'Communication Module', 'Cloud Storage', 'Controller'],
    correctAnswer: 1,
    points: 100,
    category: 'networking',
    difficulty: 'medium'
  },
  {
    question: 'You’ve logged sensor data for months and want to view old readings from anywhere using your laptop. Where should this data ideally be stored for remote access and long-term analysis?',
    options: ['EEPROM', 'Local Flash Memory', 'Cloud / Database Storage', 'RAM'],
    correctAnswer: 2,
    points: 100,
    category: 'iot',
    difficulty: 'medium'
  },
  {
    question: 'The system detects high room temperature and automatically switches on a cooling fan. Which element in the setup actually performs this physical action?',
    options: ['Controller', 'Sensor', 'Actuator', 'Signal Scaling'],
    correctAnswer: 2,
    points: 100,
    category: 'iot',
    difficulty: 'easy'
  },
  {
    question: 'I don’t move or glow, yet I control what flows. Too much of anything can harm, so I keep the current in check. Who am I?',
    options: ['Resistor', 'Capacitor', 'Diode', 'Inductor'],
    correctAnswer: 0,
    points: 100,
    category: 'electronics',
    difficulty: 'easy'
  },
  {
    question: 'A power supply briefly drops in voltage, but your circuit continues to operate smoothly for a moment. Which component helped by releasing stored charge during that dip?',
    options: ['Diode', 'Inductor', 'Capacitor', 'Resistor'],
    correctAnswer: 2,
    points: 100,
    category: 'electronics',
    difficulty: 'medium'
  },
  {
    question: 'A current tries to flow both ways through a circuit, but one tiny component allows it in only one direction — blocking the reverse path like a one-way gate. Which component ensures this controlled flow?',
    options: ['Resistor', 'Capacitor', 'Diode', 'Inductor'],
    correctAnswer: 2,
    points: 100,
    category: 'electronics',
    difficulty: 'medium'
  },
  {
    question: 'I resist change, but not like a resistor. When current rises or falls, I store energy in my invisible magnetic field — only to give it back later. Who am I, the silent keeper of flux?',
    options: ['Inductor', 'Diode', 'Capacitor', 'Resistor'],
    correctAnswer: 0,
    points: 100,
    category: 'electronics',
    difficulty: 'medium'
  },
  {
    question: 'During a circuit simulation task, you need to select, drag, and drop components quickly on your screen. Which hardware device helps you perform these precise on-screen actions?',
    options: ['Keyboard', 'Mouse', 'Touchscreen', 'Joystick'],
    correctAnswer: 1,
    points: 100,
    category: 'general',
    difficulty: 'easy'
  },
  {
    question: 'While programming your microcontroller, you type multiple commands into the IDE. Which input device serves as your interface for entering this code efficiently?',
    options: ['Joystick', 'Keyboard', 'Touchpad', 'Mouse'],
    correctAnswer: 1,
    points: 100,
    category: 'general',
    difficulty: 'easy'
  }
];
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    
    await QuizQuestion.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert components
    

    // Insert quiz questions
    await QuizQuestion.insertMany(quizQuestions);
    console.log(`✅ Inserted ${quizQuestions.length} quiz questions`);

    // Check if admin exists, if not create one
  

    console.log('\n✨ Database seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

export default seedDatabase;
