# AI-Powered Code Editor with Authentication

A modern, browser-based code editor enhanced with AI capabilities and full authentication system. Features Google's Gemini 2.0 Flash and other AI models through the OpenRouter API, with secure user authentication using vanilla HTML, CSS, and JavaScript.

![AI Code Editor Screenshot](https://via.placeholder.com/800x500.png?text=AI+Code+Editor+Screenshot)

## 🌟 Features

### Core Features

- **AI-Powered Code Generation**: Generate code using advanced AI models including Google Gemini 2.0 Flash
- **Multi-Language Support**: Supports syntax highlighting for various programming languages
- **Dark/Light Mode**: Toggle between themes based on your preference or system settings

### Authentication Features

- **User Registration & Login**: Secure account creation and login with email/password
- **Google Authentication**: Sign in with Google using Firebase Authentication
- **Session Management**: Secure session-based authentication with automatic logout
- **Password Security**: Bcrypt password hashing with salt for maximum security
- **Form Validation**: Client-side and server-side validation with user-friendly error messages
- **Responsive Design**: Authentication UI works seamlessly on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Works on both desktop and mobile devices
- **Example Prompts**: Quick-start with pre-defined code generation prompts
- **Copy to Clipboard**: One-click copy functionality for generated code
- **Model Selection**: Choose between different AI models for code generation

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (required for AI model access)
- OpenRouter API key (for AI code generation)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ai-code-editor.git
   cd ai-code-editor
   ```

2. Install dependencies:

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
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

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
3. **Google Sign-In**: Click "Continue with Google" for quick authentication (demo mode)
4. **Logout**: Click the "Logout" button when you're done

### Code Generation

1. **Login** to your account (required for full functionality)
2. Enter your coding prompt in the input area
3. (Optional) Select a different AI model from the dropdown
4. Click "Generate" or press Ctrl+Enter
5. View the generated code in the output area
6. Use the copy button to copy the code to your clipboard

### Example Prompts

- "Create a Python function to reverse a string"
- "Write a React component for a todo list"
- "Generate a SQL query to find duplicate records"
- "Create a responsive navbar with HTML, CSS, and JavaScript"

## 🌐 Technologies Used

### Frontend

- **HTML5, CSS3, JavaScript (ES6+)**: Pure vanilla implementation, no frameworks
- **Code Highlighting**: highlight.js for syntax highlighting
- **Icons**: Font Awesome for UI icons
- **Fonts**: Google Fonts (Fira Code, Segoe UI)

### Backend

- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **Session Management**: Express-session for secure user sessions
- **Password Security**: bcryptjs for password hashing
- **File Storage**: JSON-based user storage (easily replaceable with database)

### Authentication

- **Firebase Authentication**: Google sign-in integration
- **Session-based Auth**: Secure server-side session management
- **CORS**: Cross-origin resource sharing configuration

### AI Integration

- **OpenRouter API**: Access to multiple AI models including Google Gemini 2.0 Flash

## 📱 Browser Support

The editor works on all modern browsers including:

- Google Chrome (latest)
- Mozilla Firefox (latest)
- Safari (latest)
- Microsoft Edge (latest)

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
