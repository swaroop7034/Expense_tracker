import { Router } from 'express';
import membersRoutes from './routes/members.js';
import categoriesRoutes from './routes/categories.js';
import expensesRoutes from './routes/expenses.js';

import dashboardRoutes from './routes/dashboard.js';
import settlementsRoutes from './routes/settlements.js';
import activityRoutes from './routes/activity.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

router.use('/members', membersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settlements', settlementsRoutes);
router.use('/activity', activityRoutes);

export default router;
