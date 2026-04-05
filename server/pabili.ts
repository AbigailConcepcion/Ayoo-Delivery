import express, { Response } from 'express';
import { verifyToken, AuthRequest } from './authMiddleware';
// import { db } from './db'; // Placeholder for your real database driver (Prisma, TypeORM, etc.)

const router = express.Router();

/**
 * POST /api/pabili
 * Creates a new "Pabili" request.
 * Protected by verifyToken: user must be authenticated.
 */
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { items, deliveryAddress, estimatedBudget, notes } = req.body;
    
    // The user payload is attached to req by verifyToken middleware
    const user = req.user;

    // 1. Server-side Validation
    // Even if the frontend validates, the API must always verify inputs.
    if (!items || !deliveryAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items and delivery address are required.' 
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User info missing.' });
    }

    // 2. Prepare the data for the real database
    const pabiliData = {
      customerId: user.userId,
      customerEmail: user.email,
      items,
      deliveryAddress,
      estimatedBudget: Number(estimatedBudget) || 0,
      notes: notes || '',
      status: 'OPEN', // Initial status for a new request
      createdAt: new Date(),
    };

    // 3. Save to the database
    // Example: const result = await db.pabiliRequest.create({ data: pabiliData });
    console.log('Saving Pabili request to database...', pabiliData);
    const savedRequest = { id: `PAB-${Date.now()}`, ...pabiliData };

    res.status(201).json({
      success: true,
      message: 'Your Pabili request has been posted successfully!',
      data: savedRequest
    });
  } catch (error) {
    console.error('Pabili Route Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error occurred.' });
  }
});

export default router;