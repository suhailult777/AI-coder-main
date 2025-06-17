# AI-Powered Multi-Agent Code Editor with Authentication & Testing

A modern, browser-based code editor enhanced with AI capabilities, full authentication system, autonomous code generation agent, and intelligent test agent. Features Google's Gemini 2.0 Flash for code generation and Mistral Codestral for code analysis and testing, with secure user authentication and advanced multi-agent capabilities using vanilla HTML, CSS, and JavaScript.

![AI Code Editor Screenshot](https://via.placeholder.com/800x500.png?text=AI+Multi-Agent+Code+Editor+Screenshot)

## 🌟 Features

### Core Features

- **AI-Powered Code Generation**: Generate code using advanced AI models including Google Gemini 2.0 Flash
- **Multi-Agent System**: Autonomous code generation agent + intelligent test agent working together
- **Agent Mode**: Autonomous AI agent that can execute complex coding tasks with VSCode integration
- **Test Agent**: Intelligent code analysis and testing using Mistral Codestral
- **Multi-Language Support**: Supports syntax highlighting for various programming languages
- **Dark/Light Mode**: Toggle between themes based on your preference or system settings
- **Real-time Streaming**: Server-Sent Events (SSE) for real-time AI responses from both agents
- **Terminal Integration**: Execute commands and interact with system processes

### Authentication Features

- **User Registration & Login**: Secure account creation and login with email/password
- **Google Authentication**: Sign in with Google using Firebase Authentication
- **Session Management**: Secure session-based authentication with automatic logout
- **Password Security**: Bcrypt password hashing with salt for maximum security
- **Form Validation**: Client-side and server-side validation with user-friendly error messages
- **Database Support**: PostgreSQL integration with fallback to JSON storage
- **Responsive Design**: Authentication UI works seamlessly on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

### Agent Mode Features

- **Autonomous Task Execution**: AI agent can break down complex requests and execute them
- **VSCode Integration**: Automatically opens VSCode with new projects
- **File & Directory Management**: Create, organize, and manage project structures
- **Command Execution**: Run PowerShell/terminal commands for various tasks
- **Structured Thinking**: Uses START → THINK → ACTION → OBSERVE → OUTPUT workflow
- **Process Management**: Spawn and manage background processes
- **Real-time Status Updates**: Monitor agent progress through SSE streams
- **Code Content Streaming**: See actual code being written in real-time
- **File/Folder Creation Tracking**: Visual feedback for all file and directory operations

### Test Agent Features

- **Intelligent Code Analysis**: Uses Mistral Codestral for advanced code analysis
- **Automated Testing**: Generates and runs comprehensive tests for created applications
- **Multi-Language Support**: Tests various project types (HTML/CSS/JS, Node.js, Python, etc.)
- **Security Analysis**: Identifies potential security vulnerabilities and issues
- **Performance Analysis**: Evaluates code performance and optimization opportunities
- **Best Practices Review**: Checks adherence to coding standards and best practices
- **Real-time Test Streaming**: Live updates during test execution and analysis
- **Detailed Reports**: Comprehensive analysis reports saved within project folders
- **Integration Testing**: Tests application functionality, user experience, and edge cases

## 🤖 Multi-Agent System

### Overview

The Multi-Agent System consists of two intelligent AI agents working together to provide a complete development experience:

1. **Code Agent** (Gemini 2.0 Flash): Handles code generation, project creation, and development tasks
2. **Test Agent** (Mistral Codestral): Analyzes generated code, creates tests, and provides quality assurance

### Code Agent (Primary Agent)

The Code Agent is responsible for understanding user requirements and generating complete applications:

**Capabilities:**
- Complex project creation and file management
- Real-time code streaming with syntax highlighting
- Directory structure planning and creation
- Integration with development tools (VSCode)
- PowerShell/terminal command execution
- Progressive development with live feedback

**Enhanced Streaming Features:**
- **Live Code Display**: See the actual code being written in real-time
- **File Creation Tracking**: Visual indicators for files and folders being created
- **Tool Call Monitoring**: Real-time feedback on what tools are being executed
- **Content Preview**: Expandable code previews with syntax highlighting
- **Progress Indicators**: Detailed status updates throughout the development process

### Test Agent (Analysis Agent)

The Test Agent automatically analyzes generated code and provides comprehensive testing:

**Analysis Capabilities:**
- **Functional Testing**: Verifies that code works as intended
- **Security Analysis**: Identifies potential vulnerabilities
- **Performance Evaluation**: Checks for optimization opportunities
- **Code Quality Review**: Ensures adherence to best practices
- **Cross-browser Compatibility**: Tests web applications across different browsers
- **Accessibility Compliance**: Checks for accessibility standards

**Test Agent Workflow:**
1. **Project Detection**: Automatically detects newly created projects
2. **Code Analysis**: Analyzes all files in the project directory
3. **Test Generation**: Creates appropriate tests based on project type
4. **Execution**: Runs tests and validates functionality
5. **Report Generation**: Creates detailed analysis reports
6. **Real-time Updates**: Streams progress and findings to the frontend

### How the Multi-Agent System Works

1. **User Request**: User submits a coding request through the web interface
2. **Code Agent Activation**: 
   - Analyzes the request and breaks it down into actionable steps
   - Creates project structure and files
   - Streams real-time progress including code content
   - Opens the project in VSCode
3. **Test Agent Activation**: 
   - Triggered automatically when "Test Application" button is clicked
   - Analyzes the generated code comprehensively
   - Runs tests and provides detailed feedback
   - Saves analysis reports within the project directory
4. **Results**: User receives both the generated code and comprehensive test analysis

### User Flow

1. **Standard Development Flow**:
   - Toggle to **Agent Mode** in the web interface
   - Enter a complex coding request (e.g., "Build a complete REST API with authentication")
   - Click "Enter" to submit the request
   - Watch real-time code generation with live streaming
   - System automatically opens VSCode with the created project
   - Click "Test Application" when it appears to run comprehensive analysis

2. **Multi-Agent Workflow**:
   - **Code Agent**: Generates the requested application with real-time feedback
   - **Test Agent**: Analyzes the generated code and provides quality assurance
   - **Integration**: Both agents work together to deliver a complete solution

### Technical Flow

1. **Frontend Detection**: Interface detects agent mode and calls `/api/agent` endpoint
2. **Code Agent Execution**: 
   - Backend spawns the code agent process
   - Agent creates project files with detailed streaming
   - Real-time updates show code content, file creation, and tool usage
   - VSCode integration for immediate development access
3. **Test Agent Activation**:
   - User clicks "Test Application" button (appears after code generation)
   - Backend spawns test agent with Mistral Codestral
   - Comprehensive code analysis with real-time streaming
   - Detailed reports saved in project directory
4. **Results Delivery**: Complete application with analysis reports and recommendations

### Agent Capabilities

#### Code Agent Capabilities
- **Project Creation**: Create complete project structures with proper organization
- **File Management**: Create HTML, CSS, JavaScript, and other files with full content
- **Directory Organization**: Organize files into logical folder structures
- **Command Execution**: Run PowerShell/terminal commands for setup and configuration
- **VSCode Integration**: Automatic project opening in VSCode
- **Real-time Streaming**: Live code content display with syntax highlighting
- **Tool Monitoring**: Real-time feedback on tool execution and results
- **Structured Thinking**: START → THINK → ACTION → OBSERVE → OUTPUT workflow

#### Test Agent Capabilities
- **Multi-Language Analysis**: Supports web apps, Node.js, Python, and more
- **Functional Testing**: Verifies core functionality and user interactions
- **Security Analysis**: Identifies vulnerabilities and security best practices
- **Performance Testing**: Evaluates load times, responsiveness, and optimization
- **Code Quality Review**: Checks coding standards, documentation, and maintainability
- **Accessibility Testing**: Ensures compliance with accessibility standards
- **Cross-Platform Testing**: Tests compatibility across different environments
- **Automated Reporting**: Generates comprehensive analysis reports
- **Real-time Feedback**: Streams testing progress and findings live

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 16 or higher)
- **pnpm** (recommended) or **npm** (package managers)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (required for AI model access)
- OpenRouter API key (for AI code generation)
- **VSCode** (required for Agent Mode)
- **Gemini API key** (required for Code Agent)
- **Mistral API key** (required for Test Agent)
- **PowerShell** (Windows) or **Terminal** (macOS/Linux)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ai-code-editor.git
   cd ai-code-editor
   ```

2. Install dependencies using pnpm (recommended):

   ```bash
   pnpm install
   ```

   Or using npm:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file and update the following values:

   ```env
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production

   # Database Configuration (Optional - defaults to JSON storage)
   USE_DATABASE=false
   # DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

   # Code Agent Configuration (Required for Code Agent)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Test Agent Configuration (Required for Test Agent)
   MISTRAL_API_KEY=your_mistral_api_key_here

   # OpenRouter API Configuration (for standard chat mode)
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. Start the development server:

   ```bash
   # Using pnpm (recommended)
   pnpm run dev

   # Using npm
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## 🗄️ Database Setup

### Overview

The application supports both JSON file storage (default) and PostgreSQL database storage. PostgreSQL is recommended for production environments and provides better performance, security, and scalability.

### Quick PostgreSQL Setup with Neon

1. **Create Neon Account**:

   - Go to [console.neon.tech](https://console.neon.tech)
   - Sign up for a free account
   - Create a new project

2. **Get Connection String**:

   - In your Neon dashboard, go to **Connection Details**
   - Copy the connection string:

   ```
   postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

3. **Update Environment**:

   ```env
   USE_DATABASE=true
   DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

4. **Test Connection**:
   ```bash
   npm run dev
   ```
   You should see: `✅ Connected to Neon PostgreSQL database`

### Database Schema

The system automatically creates these tables:

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Session Table (Auto-created)

```sql
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
```

### Migration from JSON

If you have existing users in JSON format:

```bash
# See what would be migrated (recommended first)
npm run migrate:dry-run

# Migrate with automatic backup
npm run migrate:backup

# Direct migration
npm run migrate
```

### Health Monitoring

Check database status:

```bash
curl http://localhost:3000/api/health
```

Response includes database connection status, version, and pool statistics.

### Configuration

#### OpenRouter API Key

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key
3. Replace the `API_KEY` in `script.js` with your actual API key

#### Firebase Google Authentication (Optional)

For Google authentication to work in production:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication in the Authentication section
3. Get your Firebase configuration
4. Update `firebase-config.js` with your actual Firebase configuration
5. Set up Firebase Admin SDK credentials in your `.env` file

## 🛠️ Usage

### Authentication

1. **Sign Up**: Click "Sign In" and switch to the "Register" tab to create a new account
2. **Login**: Use your email and password to log in
3. **Google Sign-In**: Click "Continue with Google" for quick authentication
4. **Logout**: Click the "Logout" button when you're done

### Standard Code Generation

1. **Login** to your account (required for full functionality)
2. Enter your coding prompt in the input area
3. (Optional) Select a different AI model from the dropdown
4. Click "Generate" or press Ctrl+Enter
5. View the generated code in the output area
6. Use the copy button to copy the code to your clipboard

### Agent Mode Usage

1. **Enable Agent Mode**: Toggle the "Agent Mode" switch in the interface
2. **Enter Complex Request**: Describe a complex coding task (e.g., "Build a complete todo app with local storage")
3. **Submit Request**: Click "Enter" to submit your request
4. **Watch Real-time Development**: 
   - See actual code being written in real-time
   - Monitor file and folder creation
   - Track tool execution and commands
5. **VSCode Integration**: The system will automatically:
   - Open a new VSCode window with the created project
   - Organize files in proper directory structure
6. **Test Your Application**: 
   - Click the "Test Application" button when it appears
   - Watch comprehensive code analysis in real-time
   - Review detailed test reports and recommendations

### Multi-Agent Workflow

1. **Code Generation Phase**:
   - Code Agent (Gemini) analyzes your request
   - Creates project structure and writes code
   - Streams progress with live code preview
   - Shows file creation and tool execution

2. **Testing Phase**:
   - Test Agent (Mistral Codestral) analyzes the generated code
   - Performs comprehensive testing and analysis
   - Streams testing progress and findings
   - Generates detailed reports within the project folder

3. **Results**:
   - Complete, tested application ready for use
   - Comprehensive analysis and recommendations
   - VSCode integration for immediate development

### Example Prompts

#### Standard Mode

- "Create a Python function to reverse a string"
- "Write a React component for a todo list"
- "Generate a SQL query to find duplicate records"

#### Agent Mode

- "Build a complete todo application with HTML, CSS, and JavaScript"
- "Create a REST API with Express.js, authentication, and database integration"
- "Set up a React project with routing and state management"
- "Build a responsive e-commerce landing page with shopping cart functionality"

## 🧪 Testing

### Running Tests

The project includes comprehensive tests for all major functionality:

```bash
# Run all tests
npm test

# Run specific test files
node test/test-agent.js
node test/test-integration.js
node test/test-sse-flow.js
```

### Test Coverage

- **Authentication Tests**: User registration, login, session management
- **Agent Mode Tests**: Agent spawning, VSCode integration, command execution
- **SSE Tests**: Real-time streaming functionality
- **Integration Tests**: End-to-end workflow testing
- **Database Tests**: PostgreSQL and JSON storage functionality

### Debug Tools

The project includes several debug tools in the `test/` directory:

- `agent-debug.html`: Agent mode debugging interface
- `debug-frontend.html`: Frontend debugging tools
- `live-diagnostic.html`: Real-time system diagnostics
- `test-sse.html`: Server-Sent Events testing interface

## 🌐 Technologies Used

### Frontend

- **HTML5, CSS3, JavaScript (ES6+)**: Pure vanilla implementation, no frameworks
- **Code Highlighting**: highlight.js for syntax highlighting
- **Icons**: Font Awesome for UI icons
- **Fonts**: Google Fonts (Fira Code, Segoe UI)
- **Real-time Communication**: Server-Sent Events (SSE) for live updates

### Backend

- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **Session Management**: Express-session with PostgreSQL/JSON storage
- **Password Security**: bcryptjs for password hashing
- **Database**: PostgreSQL with pg library, JSON fallback
- **Process Management**: Child process spawning for agent mode

### Authentication

- **Firebase Authentication**: Google sign-in integration
- **Session-based Auth**: Secure server-side session management
- **CORS**: Cross-origin resource sharing configuration
- **Database Sessions**: PostgreSQL session storage with connect-pg-simple

### AI Integration

- **OpenRouter API**: Access to multiple AI models
- **Google Gemini 2.0 Flash**: Primary AI model for agent mode
- **Autonomous Agents**: AI-powered task execution and automation

### Agent Mode

- **VSCode Integration**: Automatic IDE launching and project management
- **Command Execution**: PowerShell/terminal command execution
- **File System Operations**: Automated file and directory management
- **Process Spawning**: Background process management for agent tasks

## 🔧 Troubleshooting

### Common Issues

#### Agent Mode Issues

**VSCode doesn't open**

- Ensure VSCode is installed and available in PATH
- Check if VSCode command `code` works in terminal
- Verify agent directory exists

**Agent doesn't start**

- Check Gemini API key in `.env` file
- Verify agent dependencies are installed
- Check server logs for error messages

**Permission errors**

- Ensure proper file system permissions
- Run as administrator if necessary (Windows)
- Check directory write permissions

#### Database Issues

**Connection refused**

- Verify DATABASE_URL is correct
- Check network connectivity to database
- Ensure database server is running

**SSL certificate error**

- Add `?sslmode=require` to connection string
- Check SSL configuration in database settings

**Migration fails**

- Backup existing data before migration
- Check database permissions
- Verify JSON file format

#### Authentication Issues

**Google sign-in not working**

- Update Firebase configuration
- Check Firebase project settings
- Verify domain is authorized in Firebase console

**Session expires immediately**

- Check SESSION_SECRET in environment
- Verify session storage configuration
- Check for clock synchronization issues

## 📁 Project Structure

```
AI-coder-main/
├── backend/                 # Backend services
│   ├── server/             # Express.js server
│   ├── api/                # API endpoints
│   ├── scripts/            # Database migration scripts
│   └── agent/              # Agent mode functionality
├── frontend/               # Frontend application
│   ├── public/             # Static assets
│   └── ...                 # HTML, CSS, JS files
├── config/                 # Configuration files
│   └── firebase-config.js  # Firebase configuration
├── test/                   # Test files and debug tools
│   ├── test-*.js          # Test scripts
│   └── *.html             # Debug interfaces
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
└── README.md              # This file
```

## 📱 Browser Support

The editor works on all modern browsers including:

- Google Chrome (latest)
- Mozilla Firefox (latest)
- Safari (latest)
- Microsoft Edge (latest)

## 🚀 Performance & Scalability

### Database Performance

- PostgreSQL connection pooling for optimal performance
- Automatic session cleanup and management
- Efficient user lookup with indexed queries

### Agent Mode Optimization

- Process spawning with proper resource management
- VSCode integration with minimal system impact
- Structured agent workflow for efficient task execution

### Real-time Features

- Server-Sent Events for low-latency updates
- Efficient streaming for large responses
- Automatic reconnection handling

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for providing access to various AI models
- [Google Gemini](https://ai.google/discover/gemini/) for the powerful AI capabilities
- [highlight.js](https://highlightjs.org/) for syntax highlighting
- [Font Awesome](https://fontawesome.com/) for the icons

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - your.email@example.com

Project Link: [https://github.com/yourusername/ai-code-editor](https://github.com/yourusername/ai-code-editor)

---

Made with ❤️ by Your Name
