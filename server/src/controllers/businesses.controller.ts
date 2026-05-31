import type { Request, Response } from 'express';
import { getBusinessById } from '../../../tiffin-flow/src/services/businessService';

export async function getBusinessByIdController(req: Request, res: Response) {
  try {
    const { businessId } = req.params;
    const business = await getBusinessById(businessId);
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }
    res.json({ success: true, data: business });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
