import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from 'node:child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables. Please check your .env file.');
    console.error('💡 Make sure you have a .env file with GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generationConfig: {
        responseMimeType: "application/json"
    }
});

function getWheatherInfo(city) {
    return `${city} has 43 Degree C`;
}

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(`⚡ Executing: ${command}`);
        exec(command, { shell: 'powershell.exe' }, function (err, stdout, stderr) {
            if (err) {
                console.error(`❌ Command failed: ${err.message}`);
                return reject(err);
            }
            const result = `stdout: ${stdout}\nstderr: ${stderr}`;
            console.log(`✅ Command completed: ${result.substring(0, 200)}...`);
            resolve(result);
        });
    });
}

const TOOLS_MAP = {
    getWheatherInfo: getWheatherInfo,
    executeCommand: executeCommand,
};

// Function to update status for the web interface
function updateStatus(status, message, projectName = null, projectPath = null, toolCall = null, toolResult = null) {
    const statusData = {
        status: status,
        message: message,
        projectName: projectName,
        projectPath: projectPath,
        toolCall: toolCall,
        toolResult: toolResult,
        timestamp: new Date().toISOString(),
        sessionId: process.env.USER_PROMPT ? Buffer.from(process.env.USER_PROMPT).toString('base64').substring(0, 10) : 'unknown'
    };

    try {
        fs.writeFileSync('agent-status.json', JSON.stringify(statusData, null, 2));
        console.log(`📊 Status updated: ${status} - ${message}`);
    } catch (error) {
        console.error('❌ Failed to write status file:', error.message);
    }
}

// Function to detect and open created project folders or files in VSCode
async function openCreatedProjectInVSCode() {
    try {
        const currentDir = process.cwd();
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        // Look for newly created directories (exclude node_modules and .git)
        const projectDirs = entries
            .filter(entry => entry.isDirectory())
            .filter(entry => !['node_modules', '.git', '.vscode'].includes(entry.name))
            .map(entry => entry.name);

        // Also look for recently created project files (html, css, js, etc.)
        const projectFiles = entries
            .filter(entry => entry.isFile())
            .filter(entry => {
                const ext = path.extname(entry.name).toLowerCase();
                return ['.html', '.css', '.js', '.json', '.md', '.txt', '.py', '.jsx', '.ts', '.tsx', '.vue'].includes(ext);
            })
            .filter(entry => entry.name !== 'agent-status.json') // Exclude status file
            .map(entry => entry.name);

        if (projectDirs.length > 0) {
            // Open the most recently created directory
            const latestProject = projectDirs
                .map(dir => ({
                    name: dir,
                    path: path.join(currentDir, dir),
                    stats: fs.statSync(path.join(currentDir, dir))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime)[0];

            console.log(`🎯 Opening project directory "${latestProject.name}" in VSCode...`);
            updateStatus('opening_vscode', `Opening project "${latestProject.name}" in VSCode...`, latestProject.name, latestProject.path);

            // Open the project directory in a new VSCode window
            const command = `code -n "${latestProject.path}"`;
            exec(command, { shell: 'powershell.exe' }, (err, stdout, stderr) => {
                if (err) {
                    console.error(`❌ Failed to open VSCode: ${err.message}`);
                    updateStatus('error', `Failed to open VSCode: ${err.message}`);
                } else {
                    console.log(`✅ Successfully opened project directory "${latestProject.name}" in VSCode`);
                    updateStatus('completed', `✅ Project "${latestProject.name}" created and opened in VSCode!`, latestProject.name, latestProject.path);
                }
            });
        } else if (projectFiles.length > 0) {
            // No directories but project files were created - open the agent directory
            console.log(`🎯 Opening agent directory with project files (${projectFiles.join(', ')}) in VSCode...`);
            updateStatus('opening_vscode', `Opening project files in VSCode...`, 'agent-project', currentDir);

            // Open the current directory (agent folder) in a new VSCode window
            const command = `code -n "${currentDir}"`;
            exec(command, { shell: 'powershell.exe' }, (err, stdout, stderr) => {
                if (err) {
                    console.error(`❌ Failed to open VSCode: ${err.message}`);
                    updateStatus('error', `Failed to open VSCode: ${err.message}`);
                } else {
                    console.log(`✅ Successfully opened agent directory with project files in VSCode`);
                    updateStatus('completed', `✅ Project files created and opened in VSCode! Files: ${projectFiles.join(', ')}`, 'agent-project', currentDir);
                }
            });
        } else {
            console.log('📁 No project directories or files found to open in VSCode');
            updateStatus('completed', '📁 Task completed - No new project directories or files created');
        }
    } catch (error) {
        console.error('❌ Error detecting project directories:', error.message);
        updateStatus('error', `Error detecting project directories: ${error.message}`);
    }
}

const SYSTEM_PROMPT = `
    You are an helpful AI Assistant who is designed to resolve user query. If you think, user query needs a tool invocation, just tell me the tool name with parameters.
    You work on START, THINK, ACTION, OBSERVE and OUTPUT Mode.

    In the start phase, user gives a query to you.
    Then, you THINK how to resolve that query atleast 3-4 times and make sure that all inputs is here
    If there is a need to call a tool, you call an ACTION event with tool and input parameters.
    If there is an action call, wait for the OBSERVE that is output of the tool.
    Based on the OBSERVE from prev step, you either output or repeat the loop.    rules:
    - Always wait for next step and wait for the next step.
    - Always output a single step and wait for the next step.
    - Output must be strictly JSON
    - Only call tool action from Available Tools only.
    - Strictly follow the output format in JSON
    - You are running on Windows, use Windows PowerShell commands (like 'type' instead of 'cat', 'dir' instead of 'ls')
    - When creating projects, ALWAYS create a dedicated project folder first using: New-Item -Path "project-name" -ItemType Directory -Force
    - Then navigate into the project folder and create all files inside it
    - To create files with content, use: @'
<content>
'@ | Out-File -FilePath "project-name/filename" -Encoding UTF8
    - For simple files, use: New-Item -Path "project-name/filename" -ItemType File -Force
    - Use double quotes around file paths to handle spaces properly
    - Use -Force parameter to overwrite existing files/folders if needed
    - For multi-line content, use proper here-string syntax with @' and '@ on separate lines
    - Make sure HTML, CSS, JS code is properly formatted with line breaks
    - When working on web projects, always create complete, functional applications
    - For web apps, create proper file structure with separate HTML, CSS, and JS files in a dedicated project folder
    - IMPORTANT: Always create a project folder first, then create files inside it - this ensures VSCode opens correctly
    - Project folder names should be descriptive (e.g., "todo-app", "calculator", "portfolio-website")

   Available Tools:
   - getWheatherInfo(city: string): string
   - executeCommand(command): string Executes a given powershell command on user's device and returns the STDOUT and STDERR.

    Example:
    START: What is wheather of Patiala?
    THINK: The user is asking for the wheather of Patiala.
    THINK: From the available tools, I must call getWheatherInfo tool for patiala as input.
    ACTION: Call Tool getWheatherInfo(patiala)
    OBSERVE: 32 Degree C
    THINK: The output of getWheatherInfo for patiala is 32 Degree C
    OUTPUT: The wheather of Patiala is 32 Degree C which is quiet hot.

    Output Example:
    { "role": "user", "content": "what is wheather of Patiala?" }
    { "step": "think", "content": "The user is asking for the wheather of Patiala." }
    { "step": "think", "content": "From the available tools, I must call getWheatherInfo tool." }
    { "step": "action", "tool": "getWheatherInfo", "input": "patiala" }
    { "step": "observe", "content": "32 Degree C" }
    { "step": "think", "content": "The output of getWheatherInfo for patiala is 32 Degree C" }
    { "step": "output", "content": "The wheather of Patiala is 32 Degree C which is quiet hot." }

    Output Format:
    { "step": "string", "tool": "string", "input": "string", "content": "string" }
`;



async function init() {
    try {
        // Initialize status
        updateStatus('starting', 'Initializing AI Agent...');

        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT,
            },
        ];

        // Get user query from environment variable or use default
        const userQuery = process.env.USER_PROMPT || 'Create a folder todo app and create a todo app with HTML CSS AND JS fully working';

        console.log('🚀 Starting AI Agent with query:', userQuery);
        console.log('📁 Working directory:', process.cwd());

        updateStatus('processing', `Processing request: "${userQuery}"`);

        messages.push({
            role: 'user',
            content: userQuery,
        });

        while (true) {
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

            const result = await model.generateContent({
                contents: conversationHistory
            });

            const response = await result.response;
            const responseText = response.text();

            messages.push({ 'role': 'assistant', 'content': responseText });

            let parsed_response;
            try {
                parsed_response = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Failed to parse JSON response:', responseText);
                console.error('Parse error:', parseError.message);
                break;
            } if (parsed_response.step && parsed_response.step === "think") {
                console.log(`🧠: ${parsed_response.content}`);
                updateStatus('thinking', `AI is thinking: ${parsed_response.content}`);
                continue;
            } if (parsed_response.step && parsed_response.step === "output") {
                console.log(`🤖: ${parsed_response.content}`);
                updateStatus('finalizing', 'Task completed! Opening project in VSCode...');

                // Auto-open the created project in VSCode
                console.log('🔍 Checking for created projects...');
                await openCreatedProjectInVSCode();

                break;
            } if (parsed_response.step && parsed_response.step === "action") {
                const tool = parsed_response.tool
                const input = parsed_response.input

                updateStatus('executing', `Executing: ${tool}`, null, null, { tool, input }, null);

                if (!TOOLS_MAP[tool]) {
                    console.error(`❌ Unknown tool: ${tool}`);
                    updateStatus('error', `Unknown tool: ${tool}`);
                    break;
                }

                try {
                    const value = await TOOLS_MAP[tool](input);
                    console.log(`⛏️: Tool Call ${tool}: (${input}) ${value}`);

                    // Send status update with tool result
                    updateStatus('tool_completed', `Completed: ${tool}`, null, null, { tool, input }, value.substring(0, 200) + (value.length > 200 ? '...' : ''));

                    messages.push({
                        "role": "assistant",
                        "content": JSON.stringify({ "step": "observe", "content": value })
                    });
                } catch (toolError) {
                    console.error(`❌ Tool execution error for ${tool}:`, toolError.message);
                    updateStatus('error', `Tool error: ${tool} - ${toolError.message}`);
                    messages.push({
                        "role": "assistant",
                        "content": JSON.stringify({ "step": "observe", "content": `Error: ${toolError.message}` })
                    });
                }
                continue;
            }
        }
    } catch (error) {
        console.error('❌ Agent initialization error:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

init();
