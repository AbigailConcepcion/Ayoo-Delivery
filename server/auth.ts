import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import { db } from './db'; // Replace with your actual Database driver (e.g. Prisma, TypeORM, or pg)

const router = express.Router();

// PRODUCTION: Store this in a .env file, NEVER hardcode it.
export const JWT_SECRET = process.env.JWT_SECRET || 'ayoo_super_secure_secret_key_2025';

/**
 * POST /api/auth/login
 * Securely authenticates users and returns a JWT session token.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Fetch user from the REAL database (not localStorage)
    // Example: const user = await db.user.findUnique({ where: { email: cleanEmail } });
    const user: any = null; // Replace with actual DB call

    if (!user) {
      // Use generic messages to prevent "account harvesting" (leaking which emails exist)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 3. Securely compare hashed password using bcrypt
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 4. Sign a JWT token for the user session
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // 5. Return success with token and safe user data
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

export default router;