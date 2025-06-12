// Agent Status Streaming API endpoint for Vercel serverless deployment
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

// Global status storage for serverless environment
let globalAgentStatus = {
    status: 'idle',
    message: 'Agent ready',
    timestamp: new Date().toISOString(),
    environment: 'serverless'
};

// Active SSE connections
let activeConnections = new Set();

// Vercel serverless function handler for SSE
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        // Handle status updates from agent execution
        try {
            const statusUpdate = req.body;
            globalAgentStatus = {
                ...globalAgentStatus,
                ...statusUpdate,
                timestamp: new Date().toISOString(),
                environment: 'serverless'
            };

            // Broadcast to all active connections
            broadcastToConnections(globalAgentStatus);

            res.json({ success: true, message: 'Status updated' });
            return;
        } catch (error) {
            console.error('Error updating status:', error);
            res.status(500).json({ error: 'Failed to update status' });
            return;
        }
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Set up SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Add this connection to active connections
        const connectionId = Date.now() + Math.random();
        const connection = { id: connectionId, res };
        activeConnections.add(connection);

        console.log(`📡 SSE client connected: ${connectionId} (${activeConnections.size} total)`);

        // Send initial connection message
        res.write('data: {"type": "connected", "message": "SSE connection established", "environment": "serverless"}\n\n');

        // Send current status immediately
        res.write(`data: ${JSON.stringify({ type: 'status', ...globalAgentStatus })}\n\n`);

        // Handle client disconnect
        req.on('close', () => {
            activeConnections.delete(connection);
            console.log(`📡 SSE client disconnected: ${connectionId} (${activeConnections.size} total)`);
        });

        req.on('error', (error) => {
            activeConnections.delete(connection);
            console.error(`📡 SSE client error: ${connectionId}`, error);
        });

        // Keep connection alive for up to 25 seconds (Vercel limit is 30s)
        setTimeout(() => {
            activeConnections.delete(connection);
            res.write('data: {"type": "timeout", "message": "Connection timeout - will reconnect"}\n\n');
            res.end();
        }, 25000);

    } catch (error) {
        console.error('SSE streaming error:', error);
        res.status(500).json({
            error: 'Failed to establish SSE connection',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Function to broadcast status updates to all active connections
function broadcastToConnections(statusData) {
    const message = `data: ${JSON.stringify({ type: 'status', ...statusData })}\n\n`;
    const deadConnections = [];

    activeConnections.forEach(connection => {
        try {
            connection.res.write(message);
        } catch (error) {
            console.error(`📡 Error sending to connection ${connection.id}:`, error.message);
            deadConnections.push(connection);
        }
    });

    // Clean up dead connections
    deadConnections.forEach(connection => activeConnections.delete(connection));

    if (activeConnections.size > 0) {
        console.log(`📡 Broadcasted status to ${activeConnections.size} connections`);
    }
}
