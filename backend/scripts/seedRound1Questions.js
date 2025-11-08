import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import QuizQuestion from '../models/QuizQuestion.js';

dotenv.config();

const questions = [
  {
    question: 'Your autonomous robot suddenly stops moving when an obstacle appears. The microcontroller didn’t “see” the obstacle directly — something else did and alerted it. Which component made this possible?',
    options: ['Actuator', 'Sensor', 'Microcontroller', 'Comm Module'],
    correctAnswer: 1,
    points: 100,
    category: 'hardware',
    difficulty: 'easy',
    isActive: true
  },
  {
    question: 'The temperature sensor gives a 20 mV signal, but your analog to digital converter needs at least 1 V to read it properly. Which stage in your design helps you bring this signal to a readable level without distorting it?',
    options: ['Filtering stage', 'Signal scaling', 'Power regulation', 'Data logger'],
    correctAnswer: 1,
    points: 100,
    category: 'hardware',
    difficulty: 'medium',
    isActive: true
  },
  {
    question: 'I neither sense nor move, yet nothing in the system happens without my decision. I follow every instruction written in code, never questioning — only executing. Who am I?',
    options: ['Sensor', 'Actuator', 'Microcontroller', 'Cloud'],
    correctAnswer: 2,
    points: 100,
    category: 'general',
    difficulty: 'easy',
    isActive: true
  },
  {
    question: 'Your weather-monitoring node collects data in a remote field. It must send temperature and humidity readings wirelessly to a dashboard 2 km away. Which unit ensures that connection happens?',
    options: ['Sensor array', 'Actuator', 'Communication module', 'Microcontroller'],
    correctAnswer: 2,
    points: 100,
    category: 'communication',
    difficulty: 'medium',
    isActive: true
  },
  {
    question: 'You’ve logged sensor data for months and want to view old readings from anywhere using your laptop. Where should this data ideally be stored for remote access and long-term analysis?',
    options: ['On the microcontroller', 'Local SD card only', 'Cloud storage', 'On a USB drive'],
    correctAnswer: 2,
    points: 100,
    category: 'cloud',
    difficulty: 'easy',
    isActive: true
  },
  {
    question: 'The system detects high room temperature and automatically switches on a cooling fan. Which element in the setup actually performs this physical action?',
    options: ['Sensor', 'Actuator', 'Controller', 'Database'],
    correctAnswer: 1,
    points: 100,
    category: 'hardware',
    difficulty: 'easy',
    isActive: true
  },
  {
    question: 'I don’t move or glow, yet I control what flows. Too much of anything can harm, so I keep the current in check. Who am I?',
    options: ['Capacitor', 'Inductor', 'Diode', 'Resistor'],
    correctAnswer: 3,
    points: 100,
    category: 'electronics',
    difficulty: 'easy',
    isActive: true
  },
  {
    question: 'A power supply briefly drops in voltage, but your circuit continues to operate smoothly for a moment. Which component helped by releasing stored charge during that dip?',
    options: ['Resistor', 'Capacitor', 'Inductor', 'Diode'],
    correctAnswer: 1,
    points: 100,
    category: 'electronics',
    difficulty: 'medium',
    isActive: true
  },
  {
    question: 'A current tries to flow both ways through a circuit, but one tiny component allows it in only one direction — blocking the reverse path like a one-way gate. Which component ensures this controlled flow?',
    options: ['Capacitor', 'Resistor', 'Inductor', 'Diode'],
    correctAnswer: 3,
    points: 100,
    category: 'electronics',
    difficulty: 'easy',
    isActive: true
  },
  {
    question: 'I resist change, but not like a resistor. When current rises or falls, I store energy in my invisible magnetic field — only to give it back later. Who am I, the silent keeper of flux?',
    options: ['Capacitor', 'Diode', 'Resistor', 'Inductor'],
    correctAnswer: 3,
    points: 100,
    category: 'electronics',
    difficulty: 'medium',
    isActive: true
  },
  {
    question: 'During a circuit simulation task, you need to select, drag, and drop components quickly on your screen. Which hardware device helps you perform these precise on-screen actions?',
    options: ['Keyboard', 'Joystick', 'Mouse', 'Trackpad'],
    correctAnswer: 2,
    points: 100,
    category: 'hardware',
    difficulty: 'easy',
    isActive: true
  },
  {
    question: 'While programming your microcontroller, you type multiple commands into the IDE. Which input device serves as your interface for entering this code efficiently?',
    options: ['Touchscreen', 'Keyboard', 'Mouse', 'Microphone'],
    correctAnswer: 1,
    points: 100,
    category: 'hardware',
    difficulty: 'easy',
    isActive: true
  }
];

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to DB — seeding questions...');

    // Remove existing seeded questions with same text to avoid duplicates
    for (const q of questions) {
      await QuizQuestion.findOneAndUpdate(
        { question: q.question },
        { $set: q },
        { upsert: true }
      );
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
