import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/businesses/:businessId/check-alerts
router.post('/businesses/:businessId/check-alerts', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    // TODO: Call Firebase Admin to check and generate alerts
    res.json({ success: true, message: 'Alert check triggered', businessId });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to check alerts' });
  }
});

export default router;
