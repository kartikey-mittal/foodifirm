import { Router } from 'express';
import { getUserByUid } from '../controllers/users.controller';

const router = Router();

router.get('/users/:uid', getUserByUid);

export default router;
