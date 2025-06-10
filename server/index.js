import { config } from 'dotenv';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to load from parent directory FIRST
const envPath = path.join(__dirname, '..', '.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

// Debug: Check if DATABASE_URL is loaded
console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');
console.log('USE_DATABASE:', process.env.USE_DATABASE);

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize server after environment variables are loaded
async function initializeServer() {
  try {
    // Now import modules that depend on environment variables
    const { setupAuth } = await import('./auth.js');
    const database = (await import('./database.js')).default;

    // Session configuration
    let sessionConfig = {
      secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    };

    // Use PostgreSQL for session storage if database is available
    if (process.env.USE_DATABASE !== 'false' && process.env.DATABASE_URL) {
      try {
        const PgSession = connectPgSimple(session);
        sessionConfig.store = new PgSession({
          conString: process.env.DATABASE_URL,
          tableName: 'session',
          createTableIfMissing: true
        });
        console.log('🗄️  Using PostgreSQL for session storage');
      } catch (error) {
        console.log('📁 Using memory store for sessions (fallback)');
      }
    } else {
      console.log('📁 Using memory store for sessions');
    }

    app.use(session(sessionConfig));

    // Setup authentication routes
    setupAuth(app);

    // Agent mode endpoint - requires authentication
    app.post('/api/agent', async (req, res) => {
      try {
        // Check if user is authenticated
        if (!req.session.userId) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please sign in to access Agent Mode'
          });
        }

        const { prompt } = req.body;

        if (!prompt || prompt.trim() === '') {
          return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log(`🤖 Agent mode request from user ${req.session.user.email}:`, prompt);

        // Path to the my-cursor agent project
        const agentPath = path.join(__dirname, '..', '..', 'my-cursor - agent mode');

        // Check if the agent directory exists
        try {
          await import('fs').then(fs => fs.promises.access(agentPath));
        } catch (error) {
          return res.status(404).json({
            error: 'Agent project not found',
            details: `Expected path: ${agentPath}`
          });
        }

        // Don't open VSCode with agent project - let the agent open the created project instead
        console.log('🤖 Starting agent without opening agent project...');

        // Start the agent with the user prompt
        const agentProcess = spawn('node', ['index.js'], {
          cwd: agentPath,
          shell: true,
          stdio: 'pipe',
          env: { ...process.env, USER_PROMPT: prompt }
        });

        let agentOutput = '';
        let agentError = '';

        agentProcess.stdout.on('data', (data) => {
          const output = data.toString();
          agentOutput += output;
          console.log('🤖 Agent output:', output);
        });

        agentProcess.stderr.on('data', (data) => {
          const error = data.toString();
          agentError += error;
          console.error('❌ Agent error:', error);
        });

        agentProcess.on('close', (code) => {
          console.log(`🏁 Agent process exited with code ${code}`);
        });

        agentProcess.on('error', (error) => {
          console.error('💥 Agent process error:', error);
        });

        // Send immediate response
        res.json({
          success: true,
          message: 'Agent mode activated! VSCode opened and agent started.',
          prompt: prompt,
          status: 'running',
          agentPath: agentPath,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('💥 Agent mode error:', error);
        res.status(500).json({
          error: 'Failed to start agent mode',
          details: error.message
        });
      }
    });

    // Serve static files
    app.use(express.static(path.join(__dirname, '..')));

    // Serve the main HTML file for the root route
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'index.html'));
    });

    // API health check
    app.get('/api/health', async (req, res) => {
      try {
        const dbHealth = await database.healthCheck();
        res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          database: dbHealth,
          environment: process.env.NODE_ENV || 'development'
        });
      } catch (error) {
        res.status(500).json({
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });

    // Agent status endpoint - requires authentication
    app.get('/api/agent/status', (req, res) => {
      try {
        // Check if user is authenticated
        if (!req.session.userId) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please sign in to access Agent Mode status'
          });
        }

        const agentPath = path.join(__dirname, '..', '..', 'my-cursor - agent mode');
        const statusFilePath = path.join(agentPath, 'agent-status.json');

        // Check if status file exists
        const fs = require('fs');
        if (fs.existsSync(statusFilePath)) {
          const statusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
          res.json(statusData);
        } else {
          res.json({
            status: 'unknown',
            message: 'No status information available',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: `Failed to read status: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Agent mode endpoint
    app.post('/api/agent-mode', (req, res) => {
      const { scriptPath, ...args } = req.body;

      if (!scriptPath) {
        return res.status(400).json({ error: 'Script path is required' });
      }

      // Spawn a new process for the agent mode script
      const child = spawn('node', [scriptPath, ...Object.values(args)], {
        stdio: 'inherit',
        shell: true
      });

      child.on('error', (error) => {
        console.error('Error starting script:', error);
        res.status(500).json({ error: 'Failed to start script' });
      });

      child.on('exit', (code) => {
        console.log(`Script exited with code ${code}`);
        res.json({ status: 'Script executed', code });
      });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Not Found' });
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start the server
initializeServer();
