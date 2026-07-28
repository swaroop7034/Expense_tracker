import { Router } from 'express';
import * as categoriesController from '../../../controllers/categoriesController.js';

const router = Router();

router.get('/', categoriesController.getAllCategories);

export default router;
