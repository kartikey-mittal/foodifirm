import type { Request, Response } from 'express';
import { getUserProfile } from '../../../tiffin-flow/src/services/userService';

export async function getUserByUid(req: Request, res: Response) {
  try {
    const { uid } = req.params;
    const user = await getUserProfile(uid);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
