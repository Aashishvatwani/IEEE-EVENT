import express from 'express';
import {
  submitSchematic,
  getRound2Data,
  getCorrectFlow,
  getSectorInfo
} from '../controllers/round2Controller.js';

const router = express.Router();

// Public routes
router.post('/submit', submitSchematic);
router.get('/team/:teamId', getRound2Data);
router.get('/correct-flow', getCorrectFlow);
router.get('/sector-info/:teamId', getSectorInfo);

export default router;
