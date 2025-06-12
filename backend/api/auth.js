import bcrypt from 'bcryptjs';
import { UserStorage } from './storage.js';
import { FirebaseAuth } from './firebase-auth.js';

const userStorage = new UserStorage();
const firebaseAuth = new FirebaseAuth();

// Helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

export function setupAuth(app) {
  // Register endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check if user already exists
      const existingUser = await userStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await userStorage.createUser({
        email,
        password: hashedPassword,
        provider: 'local',
        createdAt: new Date().toISOString()
      });

      // Set session
      req.session.userId = user.id;
      req.session.user = { id: user.id, email: user.email, provider: user.provider };

      res.status(201).json({
        id: user.id,
        email: user.email,
        provider: user.provider
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Get user
      const user = await userStorage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Set session
      req.session.userId = user.id;
      req.session.user = { id: user.id, email: user.email, provider: user.provider };

      res.json({
        id: user.id,
        email: user.email,
        provider: user.provider
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Google authentication endpoint
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: 'ID token is required' });
      }

      // Verify Firebase token
      const decodedToken = await firebaseAuth.verifyIdToken(idToken);
      const { email, name } = decodedToken;

      if (!email) {
        return res.status(400).json({ error: 'Email not found in token' });
      }

      // Check if user exists
      let user = await userStorage.getUserByEmail(email);

      if (!user) {
        // Create new user
        user = await userStorage.createUser({
          email,
          name: name || email.split('@')[0],
          provider: 'google',
          createdAt: new Date().toISOString()
        });
      }

      // Set session
      req.session.userId = user.id;
      req.session.user = { id: user.id, email: user.email, provider: user.provider };

      res.json({
        id: user.id,
        email: user.email,
        provider: user.provider
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(401).json({ error: 'Google authentication failed' });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user endpoint
  app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json(req.session.user);
  });

  // Check authentication middleware
  app.use('/api/protected', (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  });
}
