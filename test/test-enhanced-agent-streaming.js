import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulate the agent's status updates
const agentPath = path.join(__dirname, '..', 'backend', 'agent');
const statusFilePath = path.join(agentPath, 'agent-status.json');

// Ensure the agent directory exists
if (!fs.existsSync(agentPath)) {
    fs.mkdirSync(agentPath, { recursive: true });
}

console.log('🧪 Testing Enhanced Agent Streaming...');

// Test 1: Directory creation status
console.log('📁 Testing directory creation status...');
const directoryStatus = {
    status: 'creating',
    message: 'Creating directory: todo-app',
    action: 'create_directory',
    directoryName: 'todo-app',
    path: 'todo-app',
    timestamp: new Date().toISOString()
};
fs.writeFileSync(statusFilePath, JSON.stringify(directoryStatus, null, 2));

// Wait 2 seconds
await new Promise(resolve => setTimeout(resolve, 2000));

// Test 2: File creation with HTML content
console.log('📄 Testing HTML file creation status...');
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>My Todo App</h1>
        <div class="todo-input">
            <input type="text" id="todoInput" placeholder="Add a new task...">
            <button onclick="addTodo()">Add</button>
        </div>
        <ul id="todoList"></ul>
    </div>
    <script src="script.js"></script>
</body>
</html>`;

const htmlFileStatus = {
    status: 'creating',
    message: 'Writing HTML file: todo-app/index.html',
    action: 'create_file',
    fileName: 'todo-app/index.html',
    fileType: 'HTML',
    fileExtension: 'html',
    fileContent: htmlContent,
    contentPreview: htmlContent.substring(0, 500) + '\n\n... (content continues)',
    contentLength: htmlContent.length,
    linesOfCode: htmlContent.split('\n').length,
    hasContent: true,
    timestamp: new Date().toISOString()
};
fs.writeFileSync(statusFilePath, JSON.stringify(htmlFileStatus, null, 2));

// Wait 3 seconds
await new Promise(resolve => setTimeout(resolve, 3000));

// Test 3: CSS file creation
console.log('🎨 Testing CSS file creation status...');
const cssContent = `/* Todo App Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.container {
    background: white;
    padding: 2rem;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    width: 400px;
    max-width: 90vw;
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 1.5rem;
}`;

const cssFileStatus = {
    status: 'creating',
    message: 'Writing CSS file: todo-app/style.css',
    action: 'create_file',
    fileName: 'todo-app/style.css',
    fileType: 'CSS',
    fileExtension: 'css',
    fileContent: cssContent,
    contentPreview: cssContent.substring(0, 400) + '\n\n... (content continues)',
    contentLength: cssContent.length,
    linesOfCode: cssContent.split('\n').length,
    hasContent: true,
    timestamp: new Date().toISOString()
};
fs.writeFileSync(statusFilePath, JSON.stringify(cssFileStatus, null, 2));

// Wait 3 seconds
await new Promise(resolve => setTimeout(resolve, 3000));

// Test 4: JavaScript file creation
console.log('⚡ Testing JavaScript file creation status...');
const jsContent = `// Todo App JavaScript
let todos = [];
let todoId = 1;

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (text === '') {
        alert('Please enter a task!');
        return;
    }
    
    const todo = {
        id: todoId++,
        text: text,
        completed: false,
        createdAt: new Date()
    };
    
    todos.push(todo);
    input.value = '';
    renderTodos();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    renderTodos();
}

function renderTodos() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = todo.completed ? 'completed' : '';
        li.innerHTML = \`
            <span onclick="toggleTodo(\${todo.id})">\${todo.text}</span>
            <button onclick="deleteTodo(\${todo.id})">Delete</button>
        \`;
        todoList.appendChild(li);
    });
}`;

const jsFileStatus = {
    status: 'creating',
    message: 'Writing JavaScript file: todo-app/script.js',
    action: 'create_file',
    fileName: 'todo-app/script.js',
    fileType: 'JavaScript',
    fileExtension: 'js',
    fileContent: jsContent,
    contentPreview: jsContent.substring(0, 600) + '\n\n... (content continues)',
    contentLength: jsContent.length,
    linesOfCode: jsContent.split('\n').length,
    hasContent: true,
    timestamp: new Date().toISOString()
};
fs.writeFileSync(statusFilePath, JSON.stringify(jsFileStatus, null, 2));

// Wait 2 seconds
await new Promise(resolve => setTimeout(resolve, 2000));

// Test 5: Tool execution status
console.log('🔧 Testing tool execution status...');
const toolStatus = {
    status: 'executing',
    message: 'Executing: Opening VSCode',
    toolCall: {
        tool: 'executeCommand',
        input: 'code -n "todo-app"',
        description: 'Opening VSCode',
        inputDescription: 'Opening project in Visual Studio Code'
    },
    timestamp: new Date().toISOString()
};
fs.writeFileSync(statusFilePath, JSON.stringify(toolStatus, null, 2));

// Wait 2 seconds
await new Promise(resolve => setTimeout(resolve, 2000));

// Test 6: Completion status
console.log('🎉 Testing completion status...');
const completionStatus = {
    status: 'completed',
    message: '✅ Project "todo-app" created and opened in VSCode!',
    projectName: 'todo-app',
    projectPath: path.join(process.cwd(), 'todo-app'),
    timestamp: new Date().toISOString()
};
fs.writeFileSync(statusFilePath, JSON.stringify(completionStatus, null, 2));

console.log('✅ Enhanced agent streaming test completed!');
console.log('📋 Check the frontend at http://localhost:3000 to see the streaming in action');
console.log('💡 You should see detailed file creation, code content, and tool execution info');
