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
        
        // Analyze the command to provide better status updates
        let commandType = '';
        let fileName = '';
        let content = '';
        let directoryName = '';

        // Enhanced command parsing for better streaming
        if (command.includes('New-Item') && command.includes('-ItemType Directory')) {
            commandType = 'creating_directory';
            // Multiple patterns for directory creation
            let match = command.match(/New-Item\s+.*?-Path\s+["']([^"']+)["']/);
            if (!match) match = command.match(/New-Item\s+["']([^"']+)["']\s+.*?-ItemType\s+Directory/);
            if (!match) match = command.match(/mkdir\s+["']([^"']+)["']/);
            if (match) directoryName = match[1];
        } else if (command.includes('Out-File') || command.includes('>') || command.includes('Set-Content') || command.includes('Add-Content')) {
            commandType = 'creating_file';
            
            // Enhanced file path extraction
            let fileMatch = command.match(/-FilePath\s+["']([^"']+)["']/);
            if (!fileMatch) fileMatch = command.match(/>\s*["']([^"']+)["']/);
            if (!fileMatch) fileMatch = command.match(/-Path\s+["']([^"']+)["']/);
            if (!fileMatch) fileMatch = command.match(/Out-File\s+["']([^"']+)["']/);
            
            if (fileMatch) {
                fileName = fileMatch[1];
            }

            // Super enhanced content extraction for various PowerShell formats
            if (command.includes("@'") && command.includes("'@")) {
                // Here-string format: @'<content>'@ - handles multi-line content
                const contentMatch = command.match(/@'([\s\S]*?)'@/);
                if (contentMatch) {
                    content = contentMatch[1];
                    // Remove leading/trailing newlines but preserve internal formatting
                    content = content.replace(/^\n+/, '').replace(/\n+$/, '');
                }
            } else if (command.includes('@"') && command.includes('"@')) {
                // Here-string format with double quotes: @"<content>"@
                const contentMatch = command.match(/@"([\s\S]*?)"@/);
                if (contentMatch) {
                    content = contentMatch[1];
                    content = content.replace(/^\n+/, '').replace(/\n+$/, '');
                }
            } else if (command.includes('echo ') || command.includes('Write-Output ')) {
                // Echo format: echo "content"
                const echoMatch = command.match(/(?:echo|Write-Output)\s+["']([^"']*?)["']/s);
                if (echoMatch) {
                    content = echoMatch[1];
                }
            } else if (command.includes('Set-Content') || command.includes('Add-Content')) {
                // Set-Content format: Set-Content -Path "file" -Value "content"
                const contentMatch = command.match(/-Value\s+["']([^"']*?)["']/s);
                if (contentMatch) {
                    content = contentMatch[1];
                }
            } else {
                // Try to extract content from pipe operations
                const pipeMatch = command.match(/^(.*?)\s*\|\s*Out-File/);
                if (pipeMatch) {
                    const beforePipe = pipeMatch[1].trim();
                    if (beforePipe.startsWith('"') && beforePipe.endsWith('"')) {
                        content = beforePipe.slice(1, -1);
                    } else if (beforePipe.startsWith("'") && beforePipe.endsWith("'")) {
                        content = beforePipe.slice(1, -1);
                    }
                }
            }
        }

        // Send detailed status update with enhanced file content preview
        if (commandType === 'creating_directory') {
            updateStatus('creating', `Creating directory: ${directoryName}`, null, null, {
                action: 'create_directory',
                path: directoryName,
                directoryName: directoryName
            });
        } else if (commandType === 'creating_file') {
            // Determine file type for syntax highlighting
            const fileExt = fileName.split('.').pop()?.toLowerCase();
            const fileType = {
                'html': 'HTML',
                'css': 'CSS', 
                'js': 'JavaScript',
                'json': 'JSON',
                'md': 'Markdown',
                'txt': 'Text',
                'py': 'Python',
                'java': 'Java',
                'cpp': 'C++',
                'c': 'C',
                'ts': 'TypeScript',
                'jsx': 'React JSX',
                'tsx': 'React TSX',
                'vue': 'Vue'
            }[fileExt] || 'Code';

            // Clean up content - remove Windows line endings and normalize
            const cleanContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const linesOfCode = cleanContent ? cleanContent.split('\n').length : 0;
            const contentLength = cleanContent.length;

            // Create a more detailed preview
            const previewLength = Math.min(800, contentLength);
            const contentPreview = contentLength > previewLength ? 
                cleanContent.substring(0, previewLength) + '\n\n... (content continues)' : 
                cleanContent;

            updateStatus('creating', `Writing ${fileType} file: ${fileName}`, null, null, {
                action: 'create_file',
                fileName: fileName,
                fileType: fileType,
                fileExtension: fileExt,
                fileContent: cleanContent, // Full content
                contentPreview: contentPreview,
                contentLength: contentLength,
                linesOfCode: linesOfCode,
                hasContent: Boolean(cleanContent && cleanContent.trim())
            });
        }        exec(command, { shell: 'powershell.exe' }, function (err, stdout, stderr) {
            if (err) {
                console.error(`❌ Command failed: ${err.message}`);
                updateStatus('error', `Command failed: ${err.message}`, null, null, {
                    action: 'command_failed',
                    command: command.substring(0, 100) + (command.length > 100 ? '...' : ''),
                    error: err.message
                });
                return reject(err);
            }
            
            const result = `stdout: ${stdout}\nstderr: ${stderr}`;
            console.log(`✅ Command completed: ${result.substring(0, 200)}...`);
            
            // Send detailed completion status
            if (commandType === 'creating_file') {
                const fileExt = fileName.split('.').pop()?.toLowerCase();
                const fileType = {
                    'html': 'HTML',
                    'css': 'CSS',
                    'js': 'JavaScript',
                    'json': 'JSON',
                    'md': 'Markdown',
                    'txt': 'Text',
                    'py': 'Python',
                    'java': 'Java',
                    'cpp': 'C++',
                    'c': 'C',
                    'ts': 'TypeScript',
                    'jsx': 'React JSX',
                    'tsx': 'React TSX',
                    'vue': 'Vue'
                }[fileExt] || 'Code';

                const cleanContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                const actualSize = cleanContent.length;
                const actualLines = cleanContent ? cleanContent.split('\n').length : 0;

                updateStatus('file_created', `✅ ${fileType} file created: ${fileName}`, null, null, {
                    action: 'file_completed',
                    fileName: fileName,
                    fileType: fileType,
                    fileExtension: fileExt,
                    fileSize: actualSize,
                    linesOfCode: actualLines,
                    success: true,
                    hasContent: Boolean(cleanContent && cleanContent.trim()),
                    relativePath: fileName.includes('/') ? fileName.split('/').slice(-1)[0] : fileName
                });
            } else if (commandType === 'creating_directory') {
                updateStatus('directory_created', `✅ Directory created: ${directoryName}`, null, null, {
                    action: 'directory_completed',
                    directoryName: directoryName,
                    path: directoryName,
                    success: true,
                    relativePath: directoryName.includes('/') ? directoryName.split('/').slice(-1)[0] : directoryName
                });
            } else {
                // For other commands, provide generic completion info
                updateStatus('command_completed', `✅ Command executed successfully`, null, null, {
                    action: 'command_completed',
                    command: command.substring(0, 100) + (command.length > 100 ? '...' : ''),
                    success: true,
                    output: result.substring(0, 200) + (result.length > 200 ? '...' : '')
                });
            }

            resolve(result);
        });
    });
}

const TOOLS_MAP = {
    getWheatherInfo: getWheatherInfo,
    executeCommand: executeCommand,
};

// Function to update status for the web interface
function updateStatus(status, message, projectName = null, projectPath = null, additionalData = null, toolResult = null) {
    const statusData = {
        status: status,
        message: message,
        projectName: projectName,
        projectPath: projectPath,
        timestamp: new Date().toISOString(),
        sessionId: process.env.USER_PROMPT ? Buffer.from(process.env.USER_PROMPT).toString('base64').substring(0, 10) : 'unknown'
    };

    // Merge additional data if provided
    if (additionalData) {
        Object.assign(statusData, additionalData);
    }

    // Add tool result if provided
    if (toolResult) {
        statusData.toolResult = toolResult;
    }

    // Ensure backward compatibility with legacy format
    if (additionalData && additionalData.tool && additionalData.input) {
        statusData.toolCall = {
            tool: additionalData.tool,
            input: additionalData.input,
            description: additionalData.toolDescription || additionalData.tool,
            inputDescription: additionalData.inputDescription || additionalData.input
        };
    }

    try {
        fs.writeFileSync('agent-status.json', JSON.stringify(statusData, null, 2));
        console.log(`📊 Status updated: ${status} - ${message}`);
        
        // Log additional details for debugging
        if (additionalData && additionalData.action) {
            console.log(`📊 Action: ${additionalData.action}`);
        }
        if (additionalData && (additionalData.fileName || additionalData.directoryName)) {
            console.log(`📊 Target: ${additionalData.fileName || additionalData.directoryName}`);
        }
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
            }            if (parsed_response.step && parsed_response.step === "think") {
                console.log(`🧠: ${parsed_response.content}`);
                
                // Enhanced thinking status with categorization
                let thinkingCategory = 'planning';
                const thinkingContent = parsed_response.content.toLowerCase();
                
                if (thinkingContent.includes('create') || thinkingContent.includes('file') || thinkingContent.includes('folder')) {
                    thinkingCategory = 'file_planning';
                } else if (thinkingContent.includes('html') || thinkingContent.includes('css') || thinkingContent.includes('javascript')) {
                    thinkingCategory = 'code_planning';
                } else if (thinkingContent.includes('structure') || thinkingContent.includes('organize')) {
                    thinkingCategory = 'structure_planning';
                } else if (thinkingContent.includes('tool') || thinkingContent.includes('execute')) {
                    thinkingCategory = 'tool_planning';
                }
                
                updateStatus('thinking', parsed_response.content, null, null, {
                    action: 'thinking',
                    category: thinkingCategory,
                    content: parsed_response.content,
                    timestamp: new Date().toISOString()
                });
                continue;
            }if (parsed_response.step && parsed_response.step === "output") {
                console.log(`🤖: ${parsed_response.content}`);
                updateStatus('finalizing', 'Task completed! Opening project in VSCode...');

                // Auto-open the created project in VSCode
                console.log('🔍 Checking for created projects...');
                await openCreatedProjectInVSCode();

                break;
            }            if (parsed_response.step && parsed_response.step === "action") {
                const tool = parsed_response.tool
                const input = parsed_response.input

                // Enhanced tool call status with detailed information
                let toolDescription = tool;
                let inputDescription = input;
                
                if (tool === 'executeCommand') {
                    // Parse the command to provide better description
                    const cmd = input.toString();
                    if (cmd.includes('New-Item') && cmd.includes('-ItemType Directory')) {
                        const match = cmd.match(/New-Item\s+.*?-Path\s+["']([^"']+)["']/);
                        if (match) {
                            toolDescription = 'Creating Directory';
                            inputDescription = `Creating folder: ${match[1]}`;
                        }
                    } else if (cmd.includes('Out-File') || cmd.includes('>') || cmd.includes('Set-Content')) {
                        const fileMatch = cmd.match(/-FilePath\s+["']([^"']+)["']/) || 
                                         cmd.match(/>\s*["']([^"']+)["']/) ||
                                         cmd.match(/-Path\s+["']([^"']+)["']/);
                        if (fileMatch) {
                            const fileName = fileMatch[1];
                            const fileExt = fileName.split('.').pop()?.toLowerCase();
                            const fileType = {
                                'html': 'HTML',
                                'css': 'CSS',
                                'js': 'JavaScript',
                                'json': 'JSON',
                                'md': 'Markdown',
                                'txt': 'Text',
                                'py': 'Python'
                            }[fileExt] || 'Code';
                            toolDescription = `Writing ${fileType} File`;
                            inputDescription = `Creating file: ${fileName}`;
                        }
                    } else if (cmd.includes('code')) {
                        toolDescription = 'Opening VSCode';
                        inputDescription = 'Opening project in Visual Studio Code';
                    } else {
                        toolDescription = 'Executing Command';
                        inputDescription = cmd.length > 80 ? cmd.substring(0, 80) + '...' : cmd;
                    }
                }

                updateStatus('executing', `Executing: ${toolDescription}`, null, null, { 
                    tool, 
                    input,
                    toolDescription,
                    inputDescription,
                    timestamp: new Date().toISOString()
                }, null);

                if (!TOOLS_MAP[tool]) {
                    console.error(`❌ Unknown tool: ${tool}`);
                    updateStatus('error', `Unknown tool: ${tool}`, null, null, {
                        action: 'tool_error',
                        tool,
                        error: `Tool '${tool}' not found`
                    });
                    break;
                }

                try {
                    const value = await TOOLS_MAP[tool](input);
                    console.log(`⛏️: Tool Call ${tool}: (${input}) ${value}`);

                    // Enhanced tool result with truncation and formatting
                    const resultPreview = value.length > 300 ? 
                        value.substring(0, 300) + '\n... (output truncated)' : 
                        value;

                    // Send status update with detailed tool result
                    updateStatus('tool_completed', `Completed: ${toolDescription}`, null, null, { 
                        tool, 
                        input,
                        toolDescription,
                        inputDescription
                    }, {
                        fullResult: value,
                        preview: resultPreview,
                        length: value.length,
                        truncated: value.length > 300
                    });

                    messages.push({
                        "role": "assistant",
                        "content": JSON.stringify({ "step": "observe", "content": value })
                    });
                } catch (toolError) {
                    console.error(`❌ Tool execution error for ${tool}:`, toolError.message);
                    updateStatus('error', `Tool error: ${toolDescription} - ${toolError.message}`, null, null, {
                        action: 'tool_error',
                        tool,
                        toolDescription,
                        error: toolError.message
                    });
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
