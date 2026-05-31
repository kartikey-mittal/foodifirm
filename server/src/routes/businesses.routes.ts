import { Router } from 'express';
import { getBusinessByIdController } from '../controllers/businesses.controller';

const router = Router();

router.get('/businesses/:businessId', getBusinessByIdController);

export default router;
