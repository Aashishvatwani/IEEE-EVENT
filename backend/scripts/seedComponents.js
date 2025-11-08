import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Component from '../models/Component.js';
import QuizQuestion from '../models/QuizQuestion.js';
import Admin from '../models/Admin.js';

dotenv.config();

// Component data (from frontend)
const components = [
  {
    name: 'DHT22 Temperature & Humidity Sensor',
    type: 'sensor',
    icon: '📡',
    description: 'Digital sensor for measuring temperature and humidity with high accuracy',
    price: 300,
    specifications: {
      'Temperature Range': '-40°C to 80°C',
      'Humidity Range': '0-100% RH',
      'Interface': 'Digital'
    },
    category: 'essential'
  },
  {
    name: 'LM358 Op-Amp',
    type: 'signal',
    icon: '⚡',
    description: 'Dual operational amplifier for signal conditioning and amplification',
    price: 150,
    specifications: {
      'Channels': '2',
      'Supply Voltage': '3-32V',
      'Gain Bandwidth': '1MHz'
    },
    category: 'essential'
  },
  {
    name: 'ESP32 Microcontroller',
    type: 'controller',
    icon: '🧠',
    description: 'Powerful microcontroller with built-in WiFi and Bluetooth',
    price: 400,
    specifications: {
      'CPU': 'Dual-core 240MHz',
      'RAM': '520KB',
      'Flash': '4MB'
    },
    category: 'essential'
  },
  {
    name: 'ESP8266 WiFi Module',
    type: 'communication',
    icon: '📶',
    description: 'Low-cost WiFi module for IoT connectivity',
    price: 250,
    specifications: {
      'Protocol': 'WiFi 802.11 b/g/n',
      'Frequency': '2.4GHz',
      'Range': '100m'
    },
    category: 'essential'
  },
  {
    name: 'ThingSpeak Cloud Platform',
    type: 'cloud',
    icon: '☁️',
    description: 'IoT cloud platform for data visualization and analysis',
    price: 200,
    specifications: {
      'Data Channels': '8',
      'Update Rate': '15 sec',
      'API': 'RESTful'
    },
    category: 'essential'
  },
  {
    name: 'Relay Module',
    type: 'actuator',
    icon: '🔌',
    description: 'Electromagnetic switch for controlling high-power devices',
    price: 180,
    specifications: {
      'Channels': '1',
      'Load': '10A 250VAC',
      'Control': '5V DC'
    },
    category: 'essential'
  },
  {
    name: 'Ultrasonic Distance Sensor',
    type: 'sensor',
    icon: '📡',
    description: 'Non-contact distance measurement using ultrasonic waves',
    price: 200,
    specifications: {
      'Range': '2cm to 400cm',
      'Accuracy': '3mm',
      'Frequency': '40kHz'
    },
    category: 'optional'
  },
  {
    name: 'ADC Converter Module',
    type: 'signal',
    icon: '⚡',
    description: 'Analog to Digital Converter for precise signal conversion',
    price: 220,
    specifications: {
      'Resolution': '16-bit',
      'Channels': '4',
      'Sample Rate': '860 SPS'
    },
    category: 'optional'
  },
  {
    name: 'Arduino Nano',
    type: 'controller',
    icon: '🧠',
    description: 'Compact microcontroller board based on ATmega328P',
    price: 350,
    specifications: {
      'CPU': 'ATmega328P 16MHz',
      'Digital I/O': '14',
      'Analog Input': '8'
    },
    category: 'optional'
  },
  {
    name: 'LoRa Module',
    type: 'communication',
    icon: '📶',
    description: 'Long-range, low-power wireless communication module',
    price: 380,
    specifications: {
      'Frequency': '868/915MHz',
      'Range': 'Up to 15km',
      'Power': '100mW'
    },
    category: 'optional'
  },
  {
    name: 'AWS IoT Core',
    type: 'cloud',
    icon: '☁️',
    description: 'Amazon managed cloud service for IoT device connectivity',
    price: 350,
    specifications: {
      'Protocol': 'MQTT, HTTP',
      'Security': 'TLS 1.2',
      'Scale': 'Billions of devices'
    },
    category: 'optional'
  },
  {
    name: 'Servo Motor',
    type: 'actuator',
    icon: '🔌',
    description: 'Precision rotary actuator with position control',
    price: 280,
    specifications: {
      'Torque': '1.8kg-cm',
      'Speed': '0.1s/60°',
      'Control': 'PWM'
    },
    category: 'optional'
  }
];

// Quiz questions (from frontend)
const quizQuestions = [
  {
    question: 'In a smart manufacturing plant, interconnected devices share data continuously to optimize performance. What does the acronym "IoT" represent in this context?',
    options: [
      'Interconnection of Technologies',
      'Internet of Tools',
      'Internet of Things',
      'Integration of Terminals'
    ],
    correctAnswer: 2,
    points: 100,
    category: 'iot',
    difficulty: 'medium'
  },
  {
    question: 'A fleet of delivery drones sends live telemetry to a cloud dashboard. Which protocol would most efficiently support lightweight, reliable message delivery?',
    options: [
      'CoAP (Constrained Application Protocol)',
      'MQTT (Message Queuing Telemetry Transport)',
      'HTTP/2 over TCP',
      'XMPP (Extensible Messaging and Presence Protocol)'
    ],
    correctAnswer: 1,
    points: 100,
    category: 'networking',
    difficulty: 'hard'
  },
  {
    question: 'A weather monitoring IoT station includes multiple sensors. What is the sensor’s most fundamental role in such a system?',
    options: [
      'To preprocess signals before transmission',
      'To measure and convert physical parameters into electrical signals',
      'To manage cloud synchronization of recorded values',
      'To execute commands received from actuators'
    ],
    correctAnswer: 1,
    points: 100,
    category: 'iot',
    difficulty: 'medium'
  },
  {
    question: 'A developer is designing a low-cost soil moisture IoT system requiring Wi-Fi and Bluetooth. Which board offers these features by default?',
    options: [
      'Arduino Uno with external Wi-Fi module',
      'Raspberry Pi Pico',
      'ESP32',
      'STM32 Blue Pill'
    ],
    correctAnswer: 2,
    points: 100,
    category: 'electronics',
    difficulty: 'medium'
  },
  {
    question: 'In a sensor acquisition circuit, why might an engineer implement signal conditioning before sending data to a microcontroller?',
    options: [
      'To ensure the analog signal stays within ADC input limits and remove noise',
      'To compress sensor data for faster cloud uploads',
      'To encrypt analog data before conversion',
      'To convert a digital signal into analog for amplification'
    ],
    correctAnswer: 0,
    points: 100,
    category: 'electronics',
    difficulty: 'hard'
  },
  {
    question: 'A company wants to connect thousands of remote IoT sensors with secure data management and device shadowing. Which platform is designed for this scale?',
    options: [
      'AWS IoT Core',
      'Firebase Cloud Functions',
      'Azure Active Directory',
      'Google Cloud Storage'
    ],
    correctAnswer: 0,
    points: 100,
    category: 'iot',
    difficulty: 'hard'
  },
  {
    question: 'In a smart irrigation system, a valve opens automatically when soil moisture is low. What is the role of the actuator in this scenario?',
    options: [
      'To interpret humidity data for analysis',
      'To perform a physical action based on control signals',
      'To transmit the moisture data to the cloud',
      'To amplify sensor readings before processing'
    ],
    correctAnswer: 1,
    points: 100,
    category: 'iot',
    difficulty: 'medium'
  },
  {
    question: 'A rural IoT deployment requires long-range, low-power communication between farms and a central hub. Which wireless technology fits best?',
    options: [
      'Zigbee',
      'Bluetooth 5.0',
      'LoRaWAN',
      'Wi-Fi 6E'
    ],
    correctAnswer: 2,
    points: 100,
    category: 'networking',
    difficulty: 'hard'
  },
  {
    question: 'In home automation, IoT devices like smart bulbs and cameras often operate on which unlicensed frequency bands?',
    options: [
      '868 MHz ISM Band',
      '2.4 GHz and 5 GHz ISM Bands',
      '433 MHz RF Band',
      '1.2 GHz Short Range Band'
    ],
    correctAnswer: 1,
    points: 100,
    category: 'networking',
    difficulty: 'medium'
  },
  {
    question: 'To digitize an analog temperature reading for a microcontroller, which electronic unit performs the necessary conversion?',
    options: [
      'DAC (Digital-to-Analog Converter)',
      'ADC (Analog-to-Digital Converter)',
      'Op-Amp configured as a voltage follower',
      'PWM (Pulse Width Modulator)'
    ],
    correctAnswer: 1,
    points: 100,
    category: 'electronics',
    difficulty: 'hard'
  },
  {
    question: 'Edge computing is increasingly used in IoT networks. What key performance benefit does it introduce compared to centralized cloud processing?',
    options: [
      'Reduced network latency and real-time decision-making near data sources',
      'Simpler device firmware management',
      'Increased central server workload for data analytics',
      'Improved graphic rendering on IoT dashboards'
    ],
    correctAnswer: 0,
    points: 100,
    category: 'iot',
    difficulty: 'hard'
  },
  {
    question: 'A connected vehicle encrypts communication between its onboard sensors and the cloud using SSL/TLS. Which protocol combination ensures secure transmission?',
    options: [
      'HTTP over TCP/IP',
      'HTTPS with TLS encryption',
      'FTP over SSH',
      'MQTT without SSL'
    ],
    correctAnswer: 1,
    points: 100,
    category: 'networking',
    difficulty: 'hard'
  }
];


const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing quiz questions
    await QuizQuestion.deleteMany({});
    console.log('🗑️  Cleared existing quiz questions');

    // Insert quiz questions
    await QuizQuestion.insertMany(quizQuestions);
    console.log(`✅ Inserted ${quizQuestions.length} quiz questions`);

    console.log('🎉 Database seeding completed successfully!');
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
   
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Execute the seed function
seedDatabase();
