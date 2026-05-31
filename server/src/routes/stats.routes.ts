import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/businesses/:businessId/recalculate-stats
router.post('/businesses/:businessId/recalculate-stats', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    // TODO: Call Firebase Admin to recalculate stats
    res.json({ success: true, message: 'Stats recalculation triggered', businessId });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to recalculate stats' });
  }
});

export default router;
