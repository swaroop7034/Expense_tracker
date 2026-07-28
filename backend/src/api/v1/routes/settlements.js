import { Router } from 'express';
import * as settlementsController from '../../../controllers/settlementsController.js';
import { validate } from '../../../middleware/validate.js';
import { createSettlementSchema, updateSettlementSchema } from '../../../validators/settlement.validator.js';

const router = Router();

router.get('/', settlementsController.getSettlements);
router.get('/suggested', settlementsController.getSuggestedSettlements);
router.post('/', validate(createSettlementSchema), settlementsController.createSettlement);
router.put('/:id', validate(updateSettlementSchema), settlementsController.updateSettlement);
router.delete('/:id', settlementsController.deleteSettlement);

export default router;
