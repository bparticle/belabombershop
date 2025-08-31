import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Get admin password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return res.status(500).json({ error: 'Admin authentication not configured' });
    }

    // Check if password matches
    if (password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        role: 'admin',
        timestamp: Date.now()
      },
      process.env.JWT_SECRET || '',
      { expiresIn: '24h' }
    );

    // Return success with token
    res.status(200).json({ 
      success: true,
      token,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
