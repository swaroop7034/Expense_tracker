import { Router } from 'express';
import * as membersController from '../../../controllers/membersController.js';
import { validate } from '../../../middleware/validate.js';
import { createMemberSchema, updateMemberSchema } from '../../../validators/member.validator.js';

const router = Router();

router.get('/', membersController.getAllMembers);
router.get('/:id/details', membersController.getMemberDetails);
router.get('/:id', membersController.getMemberById);
router.post('/', validate(createMemberSchema), membersController.createMember);
router.put('/:id', validate(updateMemberSchema), membersController.updateMember);
router.delete('/:id', membersController.deleteMember);

export default router;
