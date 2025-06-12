// Health check endpoint for Vercel serverless deployment
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import database from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

// Vercel serverless function handler
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const healthData = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            deployment: 'vercel-serverless',
            version: '1.0.0',
            services: {
                api: 'healthy',
                agent: 'healthy',
                auth: 'healthy'
            }
        };

        // Check database health if configured
        try {
            const dbHealth = await database.healthCheck();
            healthData.database = dbHealth;
            healthData.services.database = dbHealth.status === 'connected' ? 'healthy' : 'degraded';
        } catch (error) {
            healthData.database = {
                status: 'error',
                message: error.message
            };
            healthData.services.database = 'unhealthy';
        }

        // Check environment variables
        const requiredEnvVars = [
            'SESSION_SECRET',
            'GEMINI_API_KEY'
        ];

        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingEnvVars.length > 0) {
            healthData.environment_variables = {
                status: 'warning',
                missing: missingEnvVars
            };
            healthData.services.environment = 'degraded';
        } else {
            healthData.environment_variables = {
                status: 'ok',
                configured: requiredEnvVars.length
            };
            healthData.services.environment = 'healthy';
        }

        // Check agent mode capabilities
        healthData.agent_mode = {
            status: process.env.GEMINI_API_KEY ? 'available' : 'unavailable',
            features: {
                command_execution: 'simulated',
                real_time_streaming: 'available',
                vscode_integration: 'serverless-adapted',
                file_operations: 'tmp-directory'
            }
        };

        // Overall health status
        const allServicesHealthy = Object.values(healthData.services).every(status => status === 'healthy');
        if (!allServicesHealthy) {
            healthData.status = 'DEGRADED';
        }

        // Return appropriate status code
        const statusCode = healthData.status === 'OK' ? 200 : 503;
        res.status(statusCode).json(healthData);

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message,
            deployment: 'vercel-serverless'
        });
    }
}
