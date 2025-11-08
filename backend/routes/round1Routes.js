import express from 'express';
import {
  getQuizQuestions,
  submitAnswer,
  submitQuiz,
  getComponents,
  purchaseComponents,
  getRound1Data
} from '../controllers/round1Controller.js';

const router = express.Router();

// Public routes
router.get('/quiz', getQuizQuestions);
router.post('/quiz/answer', submitAnswer);
router.post('/quiz/submit', submitQuiz);
router.get('/components', getComponents);
router.post('/purchase', purchaseComponents);
router.get('/team/:teamId', getRound1Data);

export default router;
