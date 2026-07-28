import { Router } from 'express';
import { getBreakdown } from '../../../controllers/breakdownController.js';

const router = Router();

router.get('/', getBreakdown);

export default router;
