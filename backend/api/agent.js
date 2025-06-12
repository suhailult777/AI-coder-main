// Agent Mode API endpoint for Vercel serverless deployment
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
}

// Initialize Gemini AI with error handling
let genAI = null;
let model = null;

try {
    if (GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-001",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        });
        console.log('✅ Gemini AI initialized successfully');
    } else {
        console.error('❌ Cannot initialize Gemini AI - missing API key');
    }
} catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
}

// Enhanced serverless command execution with better project tracking
async function executeCommand(command) {
    console.log(`⚡ Executing command: ${command}`);

    // Parse and handle directory creation commands
    if (command.includes('New-Item') && command.includes('-ItemType Directory')) {
        const dirMatch = command.match(/-Path\s+"([^"]+)"|New-Item\s+"([^"]+)"/);
        let dirPath = dirMatch ? (dirMatch[1] || dirMatch[2]) : null;

        if (!dirPath) {
            // Try alternative patterns
            const altMatch = command.match(/mkdir\s+([^\s]+)|New-Item\s+([^\s]+)/);
            dirPath = altMatch ? (altMatch[1] || altMatch[2]) : 'project-' + Date.now();
        }

        // Clean up the path
        dirPath = dirPath.replace(/['"]/g, '').trim();

        // Store project info for later use
        if (!global.currentProject) {
            global.currentProject = {
                name: dirPath.split(/[/\\]/).pop(),
                path: dirPath,
                files: []
            };
        }

        return `✅ Directory created: ${dirPath}`;
    }

    // Handle file creation commands
    if (command.includes('Out-File') || command.includes('>')) {
        const fileMatch = command.match(/-FilePath\s+"([^"]+)"|>\s*"?([^"\s]+)"?/);
        let filePath = fileMatch ? (fileMatch[1] || fileMatch[2]) : 'file.txt';
        filePath = filePath.replace(/['"]/g, '').trim();

        // Add to project files if we have a current project
        if (global.currentProject) {
            global.currentProject.files.push(filePath);
        }

        return `✅ File created: ${filePath}`;
    }

    // Handle content writing commands
    if (command.includes('Set-Content') || command.includes('Add-Content')) {
        const fileMatch = command.match(/-Path\s+"([^"]+)"/);
        let filePath = fileMatch ? fileMatch[1] : 'content.txt';
        filePath = filePath.replace(/['"]/g, '').trim();

        if (global.currentProject) {
            global.currentProject.files.push(filePath);
        }

        return `✅ Content written to: ${filePath}`;
    }

    // Handle directory listing
    if (command.includes('dir') || command.includes('ls') || command.includes('Get-ChildItem')) {
        const projectInfo = global.currentProject ?
            `\nProject: ${global.currentProject.name}\nFiles: ${global.currentProject.files.length}` :
            '\nNo active project';
        return `📁 Directory listing completed${projectInfo}`;
    }

    // Handle VSCode opening
    if (command.includes('code ') || command.includes('code.exe')) {
        const pathMatch = command.match(/code\s+(?:-n\s+)?"?([^"\s]+)"?/);
        const openPath = pathMatch ? pathMatch[1] : (global.currentProject?.path || 'current directory');
        return `🎯 VSCode opened for: ${openPath}`;
    }

    // Generic command execution
    return `⚡ Command executed: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`;
}

const TOOLS_MAP = {
    executeCommand: executeCommand,
};

// Function to update status for real-time feedback
async function updateStatus(status, message, projectName = null, projectPath = null, toolCall = null, toolResult = null) {
    const statusData = {
        status: status,
        message: message,
        projectName: projectName,
        projectPath: projectPath,
        toolCall: toolCall,
        toolResult: toolResult,
        timestamp: new Date().toISOString(),
        sessionId: 'serverless-' + Date.now()
    };

    console.log(`📊 Status: ${status} - ${message}`);

    // Send status update to SSE stream
    try {
        const response = await fetch('/api/agent-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(statusData)
        });

        if (!response.ok) {
            console.warn('Failed to update SSE stream:', response.status);
        }
    } catch (error) {
        console.warn('Error updating SSE stream:', error.message);
    }

    return statusData;
}

const SYSTEM_PROMPT = `
You are a helpful AI Assistant designed to resolve user queries in a serverless environment. You work in START, THINK, ACTION, OBSERVE and OUTPUT mode.

In the start phase, user gives a query to you.
Then, you THINK how to resolve that query at least 3-4 times and make sure that all inputs are here.
If there is a need to call a tool, you call an ACTION event with tool and input parameters.
If there is an action call, wait for the OBSERVE that is output of the tool.
Based on the OBSERVE from prev step, you either output or repeat the loop.

IMPORTANT SERVERLESS CONSTRAINTS:
- You are running in a serverless environment with limited file system access
- Focus on creating structured project plans and code templates
- Use simulated command execution for demonstration purposes
- Provide detailed code examples and project structures
- Generate complete, functional code that users can implement

Rules:
- Always wait for next step and wait for the next step
- Always output a single step and wait for the next step
- Output must be strictly JSON
- Only call tool action from Available Tools only
- Strictly follow the output format in JSON
- Focus on creating complete, functional applications
- Provide detailed implementation guidance

Available Tools:
- executeCommand(command): string - Simulates command execution in serverless environment

Example:
START: Create a todo app with HTML, CSS, and JavaScript
THINK: The user wants a complete todo application.
THINK: I need to create the file structure and provide complete code.
ACTION: Call Tool executeCommand("Create project structure")
OBSERVE: Project structure created
THINK: Now I need to provide the complete HTML, CSS, and JavaScript code
OUTPUT: Complete todo app created with all necessary files and functionality.

Output Format:
{ "step": "string", "tool": "string", "input": "string", "content": "string" }
`;

// Main agent processing function with improved error handling and timeouts
async function processAgentRequest(userQuery) {
    const startTime = Date.now();
    const TIMEOUT_MS = 25000; // 25 seconds to stay under Vercel's 30s limit

    try {
        // Check if Gemini AI is available
        if (!model || !GEMINI_API_KEY) {
            console.error('❌ Gemini AI not available');
            await updateStatus('error', 'Gemini AI not configured - missing API key');
            return {
                success: false,
                error: 'Gemini AI not configured. Please check GEMINI_API_KEY environment variable.',
                status: 'error'
            };
        }

        // Clear any previous project state
        global.currentProject = null;

        await updateStatus('starting', 'Initializing AI Agent...');
        console.log('🚀 Starting AI Agent with query:', userQuery);

        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT,
            },
            {
                role: 'user',
                content: userQuery,
            }
        ];

        await updateStatus('processing', `Processing request: "${userQuery}"`);

        const results = [];
        let iterations = 0;
        const maxIterations = 6; // Reduced to prevent timeouts

        while (iterations < maxIterations) {
            // Check timeout
            if (Date.now() - startTime > TIMEOUT_MS) {
                console.log('⏰ Agent processing timeout reached');
                await updateStatus('timeout', 'Processing timeout - completing with current results');
                break;
            }

            iterations++;
            console.log(`🔄 Agent iteration ${iterations}/${maxIterations}`);
            await updateStatus('processing', `Agent iteration ${iterations}/${maxIterations}`);

            // Convert messages to Gemini format
            let conversationHistory = [];

            // Add system prompt as the first user message
            conversationHistory.push({
                role: 'user',
                parts: [{ text: messages[0].content }]
            });
            conversationHistory.push({
                role: 'model',
                parts: [{ text: 'I understand. I will follow the workflow and respond in JSON format.' }]
            });

            // Add conversation messages
            for (let i = 1; i < messages.length; i++) {
                const msg = messages[i];
                if (msg.role === 'user') {
                    conversationHistory.push({
                        role: 'user',
                        parts: [{ text: msg.content }]
                    });
                } else if (msg.role === 'assistant') {
                    conversationHistory.push({
                        role: 'model',
                        parts: [{ text: msg.content }]
                    });
                }
            }

            // Add timeout to Gemini API call
            const apiCallPromise = model.generateContent({
                contents: conversationHistory
            });

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Gemini API timeout')), 10000);
            });

            let result;
            try {
                result = await Promise.race([apiCallPromise, timeoutPromise]);
            } catch (apiError) {
                console.error('❌ Gemini API error:', apiError.message);
                await updateStatus('error', `API error: ${apiError.message}`);
                return {
                    success: false,
                    error: `Gemini API error: ${apiError.message}`,
                    status: 'error',
                    iterations: iterations
                };
            }

            const response = await result.response;
            const responseText = response.text();

            console.log(`📝 Gemini response (${responseText.length} chars):`, responseText.substring(0, 200) + '...');
            messages.push({ 'role': 'assistant', 'content': responseText });

            let parsed_response;
            try {
                parsed_response = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Failed to parse JSON response:', responseText);
                await updateStatus('error', 'Invalid JSON response from AI');
                // Try to continue with a fallback
                parsed_response = { step: "output", content: responseText };
            }

            // Handle different response types
            if (parsed_response.step && parsed_response.step === "think") {
                const thinkContent = parsed_response.content || 'AI is thinking...';
                console.log(`🧠: ${thinkContent}`);
                await updateStatus('thinking', `AI is thinking: ${thinkContent}`);
                results.push({ type: 'think', content: thinkContent });
                continue;
            }

            if (parsed_response.step && parsed_response.step === "output") {
                const outputContent = parsed_response.content || 'Task completed';
                console.log(`🤖: ${outputContent}`);
                await updateStatus('completed', 'Task completed successfully!');
                results.push({ type: 'output', content: outputContent });
                break;
            }

            if (parsed_response.step && parsed_response.step === "action") {
                const tool = parsed_response.tool;
                const input = parsed_response.input;

                if (!tool) {
                    console.error('❌ No tool specified in action');
                    await updateStatus('error', 'No tool specified in action');
                    break;
                }

                await updateStatus('executing', `Executing: ${tool}`, null, null, { tool, input });
                results.push({ type: 'action', tool, input });

                if (!TOOLS_MAP[tool]) {
                    console.error(`❌ Unknown tool: ${tool}`);
                    await updateStatus('error', `Unknown tool: ${tool}`);
                    // Continue with a simulated response instead of breaking
                    const simulatedResult = `Simulated execution of ${tool} with input: ${input}`;
                    results.push({ type: 'observe', content: simulatedResult });
                    messages.push({
                        "role": "assistant",
                        "content": JSON.stringify({ "step": "observe", "content": simulatedResult })
                    });
                    continue;
                }

                try {
                    const value = await TOOLS_MAP[tool](input);
                    console.log(`⛏️: Tool Call ${tool}: (${input}) ${value}`);

                    await updateStatus('tool_completed', `Completed: ${tool}`, null, null, { tool, input }, value.substring(0, 200));
                    results.push({ type: 'observe', content: value });

                    messages.push({
                        "role": "assistant",
                        "content": JSON.stringify({ "step": "observe", "content": value })
                    });
                } catch (toolError) {
                    console.error(`❌ Tool execution error for ${tool}:`, toolError.message);
                    await updateStatus('error', `Tool error: ${tool} - ${toolError.message}`);
                    results.push({ type: 'error', content: toolError.message });
                    // Continue instead of breaking to allow recovery
                    continue;
                }
                continue;
            }

            // Handle unexpected response format
            if (!parsed_response.step) {
                console.log('⚠️ Unexpected response format, treating as output');
                const content = parsed_response.content || JSON.stringify(parsed_response);
                await updateStatus('completed', 'Task completed with unexpected format');
                results.push({ type: 'output', content: content });
                break;
            }
        }

        // Ensure we have some results
        if (results.length === 0) {
            console.log('⚠️ No results generated, adding default output');
            results.push({
                type: 'output',
                content: 'Agent completed processing but generated no specific output. This may indicate an issue with the AI model response format.'
            });
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ Agent processing completed in ${processingTime}ms with ${iterations} iterations`);

        // Get project information if available
        const projectInfo = global.currentProject;
        const completionMessage = projectInfo ?
            `Project "${projectInfo.name}" completed with ${projectInfo.files.length} files` :
            `Task completed in ${processingTime}ms`;

        await updateStatus('completed', completionMessage, projectInfo?.name, projectInfo?.path);

        return {
            success: true,
            results: results,
            iterations: iterations,
            status: 'completed',
            processingTime: processingTime,
            projectName: projectInfo?.name,
            projectPath: projectInfo?.path,
            projectFiles: projectInfo?.files || []
        };

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Agent processing error:', error.message);
        console.error('Error stack:', error.stack);
        await updateStatus('error', `Agent error: ${error.message}`);

        return {
            success: false,
            error: error.message,
            status: 'error',
            processingTime: processingTime,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    }
}

// Session configuration for serverless
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
};

// Simple session parser for serverless
function parseSession(req) {
    try {
        const cookies = req.headers.cookie;
        if (!cookies) return null;

        // Extract session cookie (simplified for demo)
        const sessionMatch = cookies.match(/connect\.sid=([^;]+)/);
        if (!sessionMatch) return null;

        // In a real implementation, you'd decrypt and validate the session
        // For now, we'll check for a basic session indicator
        return sessionMatch[1] ? { userId: 'demo-user' } : null;
    } catch (error) {
        console.error('Session parsing error:', error);
        return null;
    }
}

// Vercel serverless function handler
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // For now, skip authentication in serverless mode to test functionality
    // TODO: Implement proper serverless session handling
    console.log('🔓 Skipping authentication in serverless mode for testing');

    try {
        const { prompt } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                error: 'Prompt is required',
                timestamp: new Date().toISOString()
            });
        }

        // Check if Gemini API is configured
        if (!GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY not configured');
            return res.status(500).json({
                error: 'Agent mode not available - Gemini API key not configured',
                details: 'Please configure GEMINI_API_KEY environment variable',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`🤖 Agent mode request (${prompt.length} chars):`, prompt.substring(0, 100) + '...');

        // Process the agent request with timeout
        const requestTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 28000); // 28s timeout
        });

        const agentPromise = processAgentRequest(prompt);

        let result;
        try {
            result = await Promise.race([agentPromise, requestTimeout]);
        } catch (timeoutError) {
            console.error('⏰ Agent request timeout');
            return res.status(408).json({
                error: 'Agent request timeout',
                details: 'The agent processing took too long and was terminated',
                timestamp: new Date().toISOString()
            });
        }

        const responseData = {
            success: result.success,
            message: result.success ? 'Agent mode completed successfully!' : 'Agent mode failed',
            prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
            results: result.results || [],
            iterations: result.iterations || 0,
            status: result.status,
            processingTime: result.processingTime,
            projectName: result.projectName,
            projectPath: result.projectPath,
            projectFiles: result.projectFiles || [],
            timestamp: new Date().toISOString(),
            environment: 'serverless'
        };

        if (!result.success) {
            responseData.error = result.error;
            responseData.details = result.details;
        }

        const statusCode = result.success ? 200 : 500;
        res.status(statusCode).json(responseData);

    } catch (error) {
        console.error('💥 Agent mode handler error:', error);
        res.status(500).json({
            error: 'Failed to process agent request',
            details: error.message,
            timestamp: new Date().toISOString(),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
