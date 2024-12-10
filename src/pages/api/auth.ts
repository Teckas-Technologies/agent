import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { Developer } from '@/models/Developer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    if (req.method === 'POST') {
      await connectToDatabase();
      let developer = await Developer.findOne({ email });

      if (developer) {
        // Login: Validate password
        const isValid = await bcrypt.compare(password, developer.password);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        return res.status(200).json({ message: 'Login successful', developerId: developer._id });
      } else {
        // Register: Hash password and save developer
        const hashedPassword = await bcrypt.hash(password, 10);
        developer = new Developer({ email, password: hashedPassword });
        await developer.save();

        return res.status(201).json({ message: 'Registration successful', developerId: developer._id });
      }
    } else {
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (err) {
    console.error('Error in auth handler:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
