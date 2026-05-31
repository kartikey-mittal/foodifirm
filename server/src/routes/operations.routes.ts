import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/businesses/:businessId/generate-daily-orders
router.post('/businesses/:businessId/generate-daily-orders', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { date } = req.body;
    // TODO: Call Firebase Admin to generate daily orders
    res.json({ success: true, message: 'Daily orders generation triggered', businessId, date });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate daily orders' });
  }
});

export default router;
