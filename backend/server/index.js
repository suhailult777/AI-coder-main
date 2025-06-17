import { config } from 'dotenv';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to load from project root
const envPath = path.join(__dirname, '..', '..', '.env');
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
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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

        // Path to the integrated agent project
        const agentPath = path.join(__dirname, '..', 'agent');

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

    // Serve static files from frontend directory
    app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

    // Serve the main HTML file for the root route
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'));
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

    // SSE clients management
    const sseClients = new Set();

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

        const agentPath = path.join(__dirname, '..', 'agent');
        const statusFilePath = path.join(agentPath, 'agent-status.json');

        // Check if status file exists
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

    // SSE endpoint for real-time agent status streaming
    app.get('/api/agent/status/stream', (req, res) => {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please sign in to access Agent Mode status stream'
        });
      }

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection message
      res.write('data: {"type": "connected", "message": "SSE connection established"}\n\n');

      // Add client to the set
      const clientId = Date.now() + Math.random();
      const client = { id: clientId, res, userId: req.session.userId };
      sseClients.add(client);

      console.log(`📡 SSE client connected: ${clientId} (${sseClients.size} total clients)`);

      // Send current status immediately if available
      try {
        const agentPath = path.join(__dirname, '..', 'agent');
        const statusFilePath = path.join(agentPath, 'agent-status.json');

        if (fs.existsSync(statusFilePath)) {
          const statusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
          res.write(`data: ${JSON.stringify({ type: 'status', ...statusData })}\n\n`);
        }
      } catch (error) {
        console.error('Error sending initial status:', error);
      }

      // Handle client disconnect
      req.on('close', () => {
        sseClients.delete(client);
        console.log(`📡 SSE client disconnected: ${clientId} (${sseClients.size} total clients)`);
      });

      req.on('error', (error) => {
        console.error(`📡 SSE client error: ${clientId}`, error);
        sseClients.delete(client);
      });
    });

    // Function to broadcast status updates to all SSE clients
    function broadcastAgentStatus(statusData) {
      const message = `data: ${JSON.stringify({ type: 'status', ...statusData })}\n\n`;
      const deadClients = [];
      sseClients.forEach(client => {
        try {
          client.res.write(message);
        } catch (error) {
          console.error(`📡 Error sending to SSE client ${client.id}:`, error.message);
          deadClients.push(client);
        }
      });
      deadClients.forEach(client => sseClients.delete(client));
      if (sseClients.size > 0) {
        console.log(`📡 Broadcasted status to ${sseClients.size} SSE clients`);
      }
    }

    // --- Test Agent SSE Setup ---
    const testAgentSseClients = new Set();

    app.get('/api/test-agent/status/stream', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const clientId = Date.now();
      const newClient = { id: clientId, res };
      testAgentSseClients.add(newClient);
      console.log(`➕ Test agent SSE client connected: ${clientId}`);

      req.on('close', () => {
        testAgentSseClients.delete(newClient);
        console.log(`➖ Test agent SSE client disconnected: ${clientId}`);
      });
    });

    function broadcastTestAgentStatus(statusData) {
      const message = `data: ${JSON.stringify(statusData)}\n\n`;
      const deadClients = [];
      testAgentSseClients.forEach(client => {
        try {
          client.res.write(message);
        } catch (error) {
          console.error(`Error sending to test agent SSE client ${client.id}:`, error.message);
          deadClients.push(client);
        }
      });
      deadClients.forEach(client => testAgentSseClients.delete(client));
    }

    // --- Generic File Watcher Setup ---
    function watchStatusFile(filePath, broadcastFunction, agentName) {
      const agentDir = path.dirname(filePath);
      if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
      }

      function setupWatcher() {
        try {
          if (fs.existsSync(filePath)) {
            const watcher = fs.watch(filePath, (eventType, filename) => {
              if (eventType === 'change') {
                try {
                  const statusData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                  broadcastFunction(statusData);
                } catch (error) {
                  // Ignore read errors, file might be being written or is empty
                }
              }
            });
            console.log(`📁 Watching ${agentName} agent status file for changes at ${filePath}`);
            process.on('SIGINT', () => watcher.close());
            return true;
          } else {
            return false;
          }
        } catch (error) {
          console.error(`Error setting up watcher for ${agentName}:`, error);
          return false;
        }
      }

      // Try to set up watcher immediately
      if (!setupWatcher()) {
        console.log(`📁 ${agentName} agent status file does not exist yet. Checking periodically...`);

        // Check every 5 seconds for the file to be created
        const checkInterval = setInterval(() => {
          if (setupWatcher()) {
            clearInterval(checkInterval);
          }
        }, 5000);

        // Clear interval on shutdown
        process.on('SIGINT', () => clearInterval(checkInterval));
      }
    }

    // --- Initialize Watchers ---
    // Main Agent
    const agentPath = path.join(__dirname, '..', 'agent');
    const statusFilePath = path.join(agentPath, 'agent-status.json');
    watchStatusFile(statusFilePath, broadcastAgentStatus, 'Main');

    // Test Agent
    const testAgentPath = path.join(__dirname, '..', 'agents');
    const testStatusFilePath = path.join(testAgentPath, 'test-agent-status.json');
    watchStatusFile(testStatusFilePath, broadcastTestAgentStatus, 'Test');

    // Cleanup on server shutdown
    process.on('SIGINT', () => {
      sseClients.forEach(client => {
        try {
          client.res.end();
        } catch (error) {
          // Ignore errors when closing
        }
      });
      sseClients.clear();
      console.log('Server shutting down...');
      process.exit(0);
    });

    // Status simulation endpoint for testing (development only)
    app.post('/api/simulate-status', (req, res) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not available in production' });
      }

      try {
        const statusData = req.body;
        const agentPath = path.join(__dirname, '..', 'agent');
        const statusFilePath = path.join(agentPath, 'agent-status.json');

        // Create agent directory if it doesn't exist
        if (!fs.existsSync(agentPath)) {
          fs.mkdirSync(agentPath, { recursive: true });
        }

        // Write the simulated status
        fs.writeFileSync(statusFilePath, JSON.stringify(statusData, null, 2));

        console.log(`🧪 Simulated status: ${statusData.status} - ${statusData.message}`);

        res.json({ success: true, message: 'Status simulated successfully' });
      } catch (error) {
        console.error('Status simulation error:', error);
        res.status(500).json({ error: 'Failed to simulate status' });
      }
    });

    // Test Agent endpoint
    app.post('/api/test-agent/run', (req, res) => {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please sign in to access Test Agent'
        });
      }

      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Code to test is required' });
      }

      console.log(`🧪 Test Agent request from user ${req.session.user.email}`);

      // Find the most recently created project by the main agent
      let targetProjectPath = null;
      try {
        const agentPath = path.join(__dirname, '..', 'agent');
        const projects = fs.readdirSync(agentPath)
          .filter(item => {
            const fullPath = path.join(agentPath, item);
            return fs.statSync(fullPath).isDirectory() &&
              item !== 'node_modules' &&
              !item.endsWith('.json');
          })
          .map(item => ({
            name: item,
            path: path.join(agentPath, item),
            created: fs.statSync(path.join(agentPath, item)).birthtime // Use birthtime for creation
          }))
          .sort((a, b) => b.created - a.created);

        if (projects.length > 0) {
          targetProjectPath = projects[0].path;
          console.log(`🎯 Target project: ${projects[0].name} (${targetProjectPath})`);
        } else {
          return res.status(404).json({
            error: 'No project found to test',
            message: 'Please create a project with the main agent first'
          });
        }
      } catch (error) {
        console.error('Error finding project to test:', error);
        return res.status(500).json({
          error: 'Failed to find project',
          message: error.message
        });
      }

      const testAgentScriptPath = path.join(__dirname, '..', 'agents', 'test_agent.js');

      const testAgentProcess = spawn('node', [`"${testAgentScriptPath}"`], {
        cwd: path.dirname(testAgentScriptPath),
        shell: true,
        stdio: 'pipe',
        env: {
          ...process.env,
          USER_CODE_TO_TEST: code,
          TARGET_PROJECT_PATH: targetProjectPath
        }
      });

      testAgentProcess.stdout.on('data', (data) => {
        console.log('🧪 Test Agent output:', data.toString());
      });

      testAgentProcess.stderr.on('data', (data) => {
        console.error('🧪 Test Agent error:', data.toString());
      });

      testAgentProcess.on('close', (code) => {
        console.log(`🧪 Test Agent process exited with code ${code}`);
      });

      res.json({ success: true, message: 'Test agent started' });
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

    // Get test analysis report endpoint
    app.get('/api/test-agent/report', (req, res) => {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please sign in to access test reports'
        });
      }

      try {
        // Find the latest project with a test report
        const agentPath = path.join(__dirname, '..', 'agent');
        const projects = fs.readdirSync(agentPath)
          .filter(item => {
            const fullPath = path.join(agentPath, item);
            return fs.statSync(fullPath).isDirectory() && item !== 'node_modules';
          })
          .map(item => ({
            name: item,
            path: path.join(agentPath, item),
            created: fs.statSync(path.join(agentPath, item)).mtime
          }))
          .sort((a, b) => b.created - a.created);

        // Look for a project with a test analysis report
        for (const project of projects) {
          const reportPath = path.join(project.path, 'TEST_ANALYSIS_REPORT.md');
          if (fs.existsSync(reportPath)) {
            const reportContent = fs.readFileSync(reportPath, 'utf8');
            return res.json({
              success: true,
              projectName: project.name,
              reportPath: reportPath,
              reportContent: reportContent,
              timestamp: fs.statSync(reportPath).mtime
            });
          }
        }

        res.status(404).json({
          error: 'No test report found',
          message: 'No test analysis report found. Please run the test agent first.'
        });

      } catch (error) {
        console.error('Error fetching test report:', error);
        res.status(500).json({
          error: 'Failed to fetch test report',
          message: error.message
        });
      }
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
