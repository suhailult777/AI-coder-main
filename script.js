const API_KEY = "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"; // Replace with your actual API key
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Function to set the prompt textarea value
function setPrompt(text) {
    const promptTextarea = document.getElementById('prompt');
    if (promptTextarea) {
        promptTextarea.value = text;
        promptTextarea.focus(); // Optional: focus the textarea after setting value
    }
}

// Variable to track if user has manually scrolled
let userHasScrolled = false;

async function generateCode() {
    // Reset the scroll tracking when starting a new generation
    userHasScrolled = false;

    const prompt = document.getElementById('prompt').value;
    const outputContainer = document.querySelector('.output-container'); // Get the container
    const output = document.getElementById('output');
    const copyButton = document.getElementById('copyButton'); // Get copy button
    const copyButtonSpan = copyButton ? copyButton.querySelector('span') : null; // Get button text span
    const generateButton = document.getElementById('generateButton'); // Get the generate button
    const modelSelect = document.getElementById('model-select'); // Get the model select dropdown

    // --- Start: Show output container ---
    if (outputContainer) {
        outputContainer.style.display = 'block'; // Make it visible
    }
    // --- End: Show output container ---

    // Get the selected model from the dropdown
    const selectedModel = modelSelect ? modelSelect.value : "google/gemini-2.0-flash-exp:free";

    // Check if the selected model is a Gemini model
    const isGeminiModel = selectedModel.includes('gemini');
    const isGeminiFlash = selectedModel.includes('gemini-2.0-flash');

    // --- Start: Feedback on button click ---
    if (generateButton) {
        generateButton.disabled = true;
        generateButton.textContent = 'Generating...';

        // Only add the pulse animation for Gemini models
        if (isGeminiModel) {
            generateButton.classList.add('generating'); // Add pulse animation class for Gemini models
        }
    }
    // --- End: Feedback on button click ---

    // Reset copy button state
    if (copyButtonSpan) {
        copyButtonSpan.textContent = 'Copy';
        copyButton.classList.remove('copied');
    }

    // Clear existing language class and remove highlight.js styling attributes
    output.className = '';
    output.removeAttribute('data-highlighted');

    // Use different loading animations based on the selected model
    if (isGeminiFlash) {
        // Special animation for Gemini Flash
        output.innerHTML = `
            <div class="loading-container flash-loading">
                <span>Generating with Gemini Flash</span>
                <span class="loading-dot">.</span>
                <span class="loading-dot">.</span>
                <span class="loading-dot">.</span>
            </div>
        `;
    } else if (isGeminiModel) {
        // Animation for other Gemini models
        output.innerHTML = `
            <div class="loading-container gemini-loading">
                <span>Generating with Gemini</span>
                <span class="loading-dot">.</span>
                <span class="loading-dot">.</span>
                <span class="loading-dot">.</span>
            </div>
        `;
    } else {
        // Standard animation for other models
        output.innerHTML = `
            <div class="loading-container">
                <span>Generating code</span>
                <span class="loading-dot">.</span>
                <span class="loading-dot">.</span>
                <span class="loading-dot">.</span>
            </div>
        `;
    }

    try {
        // Make sure we have a prompt
        if (!prompt || prompt.trim() === '') {
            output.innerHTML = `<span class="error-message">Please enter a prompt before generating code.</span>`;
            if (generateButton) {
                generateButton.disabled = false;
                generateButton.textContent = 'Enter';
                generateButton.classList.remove('generating'); // Remove pulse animation class
            }
            return; // Exit the function early
        }

        // We already got the selected model and Gemini status above

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href,
                "X-Title": "AI Coder"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [{ role: "user", content: `Write code for: ${prompt}` }],
                max_tokens: 2000,
                temperature: 0.3, // Lower temperature for more focused output with Flash model
                top_p: 0.95, // Slightly more focused sampling for code generation
                stream: true // Enable streaming
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("API Error:", response.status, errorData);
            throw new Error(`API Error (${response.status}): ${errorData || 'Unknown error'}`);
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let firstChunkReceived = false;
        let errorOccurred = false;

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Remove loading indicator on first chunk
                if (!firstChunkReceived && chunk.trim().length > 0) { // Check if chunk has content
                    output.innerHTML = ''; // Clear loading animation
                    firstChunkReceived = true;
                }

                // Process Server-Sent Events (SSE)
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataContent = line.substring(6).trim();
                        if (dataContent === '[DONE]') {
                            break;
                        }
                        try {
                            const jsonData = JSON.parse(dataContent);

                            // Check for error in the response
                            if (jsonData.error) {
                                const errorMessage = jsonData.error.message || "Unknown API error";
                                output.innerHTML = `<span class="error-message">Error: ${errorMessage}</span>`;
                                errorOccurred = true;
                                break; // Exit the loop on error
                            }

                            if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                                const contentPiece = jsonData.choices[0].delta.content;
                                fullContent += contentPiece;

                                // Use innerHTML instead of textContent to avoid conflict
                                if (output.innerHTML === '') {
                                    output.innerHTML = contentPiece;
                                } else {
                                    output.innerHTML += contentPiece;
                                }

                                // Auto-scroll to the bottom if user hasn't manually scrolled
                                if (!userHasScrolled) {
                                    const preElement = output.parentElement;
                                    preElement.scrollTop = preElement.scrollHeight;
                                }
                            }
                        } catch (e) {
                            // Check if this might be an error message that's not valid JSON
                            if (line.includes("error") && line.includes("message")) {
                                try {
                                    // Try to extract just the error part
                                    const errorMatch = line.match(/"error":\s*{[^}]*"message":\s*"([^"]+)"/);
                                    if (errorMatch && errorMatch[1]) {
                                        output.innerHTML = `<span class="error-message">Error: ${errorMatch[1]}</span>`;
                                        errorOccurred = true;
                                        break;
                                    }
                                } catch (extractError) {
                                    // Ignore extraction errors
                                }
                            }
                        }
                    }
                }

                // If we found an error, stop processing the stream
                if (errorOccurred) {
                    break;
                }
            }
        } catch (streamError) {
            output.innerHTML = `<span class="error-message">Error reading response stream: ${streamError.message}</span>`;
        }

        // If we got an error, don't proceed with post-processing
        if (errorOccurred) {
            return;
        }

        // --- Post-streaming processing ---
        if (fullContent.length > 0) {
            // Ensure the final complete content is set before highlighting
            output.textContent = fullContent;

            // Language detection (after full content is received)
            let language = 'plaintext'; // Default to plaintext
            const firstFewLines = fullContent.split('\n').slice(0, 5).join('\n').toLowerCase();
            const codeBlockMatch = fullContent.match(/^```(\w+)/); // Check for markdown code block language

            if (codeBlockMatch) {
                language = codeBlockMatch[1];
            } else if (firstFewLines.includes('<!doctype html>') || firstFewLines.includes('<html')) {
                language = 'html';
            } else if (firstFewLines.includes('function') || firstFewLines.includes('const') || firstFewLines.includes('let') || firstFewLines.includes('var')) {
                language = 'javascript';
            } else if (firstFewLines.includes('<?php')) {
                language = 'php';
            } else if (firstFewLines.includes('import ') || firstFewLines.includes('class ') || firstFewLines.includes('def ')) {
                language = 'python';
            } else if (firstFewLines.includes('{') && firstFewLines.includes('}') && (firstFewLines.includes(':') || firstFewLines.includes('#') || firstFewLines.includes('.'))) {
                language = 'css';
            }

            output.className = `language-${language}`;

            // Apply syntax highlighting
            if (typeof hljs !== 'undefined') {
                // Ensure highlight.js processes the final, complete content
                hljs.highlightElement(output);
            }
        }

    } catch (error) {
        // Ensure loading animation is removed on error
        output.innerHTML = `<span class="error-message">Error generating code: ${error.message}</span>`;
        output.className = ''; // Clear language class on error
    } finally {
        // --- Start: Restore button state ---
        if (generateButton) {
            generateButton.disabled = false;
            generateButton.textContent = 'Enter';
            generateButton.classList.remove('generating'); // Remove pulse animation class
        }
        // --- End: Restore button state ---
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Test console log to ensure script is loading
    console.log('Script loaded successfully!');
    console.log('Current time:', new Date());

    // Initialize syntax highlighting if needed (assuming hljs is loaded)
    if (typeof hljs !== 'undefined') {
        // If you want to highlight existing code on load, uncomment the next line
        // hljs.highlightAll();
    }

    // Add event listener for model selection change
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        // Set initial state based on default selection
        updateGeminiModelClass();

        // Update when model changes
        modelSelect.addEventListener('change', updateGeminiModelClass);
    }

    // Function to update body class based on selected model
    function updateGeminiModelClass() {
        const selectedModel = modelSelect.value;
        const isGeminiModel = selectedModel.includes('gemini');

        if (isGeminiModel) {
            document.body.classList.add('gemini-model-selected');
        } else {
            document.body.classList.remove('gemini-model-selected');
        }
    }

    // Add event listener for Enter key in the prompt textarea
    const promptTextarea = document.getElementById('prompt');
    if (promptTextarea) {
        promptTextarea.addEventListener('keydown', function (event) {
            // Check if Enter key was pressed without Shift (Shift+Enter allows for newlines)
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent default behavior (newline)
                generateCode(); // Call the generate function
            }
        });
    }

    // Add scroll event listener to detect manual scrolling
    const outputElement = document.getElementById('output');
    if (outputElement && outputElement.parentElement) {
        const preElement = outputElement.parentElement;
        preElement.addEventListener('scroll', function () {
            // Check if this is a manual scroll during code generation
            // We determine this by checking if the scroll position is not at the bottom
            const isAtBottom = preElement.scrollHeight - preElement.scrollTop <= preElement.clientHeight + 10; // 10px tolerance

            // If we're not at the bottom during generation, user has manually scrolled
            if (!isAtBottom && outputElement.innerHTML.includes('loading-container') === false) {
                userHasScrolled = true;
            }
        });

        // Reset scroll tracking when user scrolls back to bottom
        preElement.addEventListener('scroll', function () {
            const isAtBottom = preElement.scrollHeight - preElement.scrollTop <= preElement.clientHeight + 10;
            if (isAtBottom) {
                // If user manually scrolls back to bottom, resume auto-scrolling
                userHasScrolled = false;
            }
        });
    }

    // Side Navigation functionality
    const openNavBtn = document.getElementById('openNav');
    const closeNavBtn = document.getElementById('closeNav');
    const sideNav = document.getElementById('mySidenav');
    const overlay = document.getElementById('overlay');

    // Open side navigation
    if (openNavBtn) {
        openNavBtn.addEventListener('click', function () {
            sideNav.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when nav is open
        });
    }

    // Close side navigation
    if (closeNavBtn) {
        closeNavBtn.addEventListener('click', closeNav);
    }

    // Close nav when clicking on overlay
    if (overlay) {
        overlay.addEventListener('click', closeNav);
    }

    // Function to close the side navigation
    function closeNav() {
        sideNav.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Close side nav when window is resized to desktop size
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && sideNav.classList.contains('open')) {
            closeNav();
        }
    });

    // Copy button functionality
    const copyButton = document.getElementById('copyButton');
    const outputCodeElement = document.getElementById('output');

    if (copyButton && outputCodeElement) {
        copyButton.addEventListener('click', function () {
            const codeToCopy = outputCodeElement.textContent;
            if (codeToCopy) {
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    // Success feedback
                    const buttonSpan = copyButton.querySelector('span');
                    buttonSpan.textContent = 'Copied!';
                    copyButton.classList.add('copied');

                    // Reset button after 2 seconds
                    setTimeout(() => {
                        buttonSpan.textContent = 'Copy';
                        copyButton.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy code: ', err);
                    // Optional: Provide error feedback on the button
                    const buttonSpan = copyButton.querySelector('span');
                    buttonSpan.textContent = 'Error';
                    setTimeout(() => {
                        buttonSpan.textContent = 'Copy';
                    }, 2000);
                });
            } else {
                console.warn('No code to copy.');
            }
        });
    }

    // --- Theme Toggle Logic ---
    const themeToggleButton = document.getElementById('themeToggle');
    const bodyElement = document.body;
    const lightThemeIcon = '☀️';
    const darkThemeIcon = '🌙';
    // Link to the highlight.js light theme (replace with your preferred one)
    const lightHljsThemeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css';
    const darkHljsThemeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/vs2015.min.css';
    const hljsThemeLink = document.querySelector('link[href*="highlight.js/styles"]');

    // Function to set theme
    function setTheme(isLight) {
        if (isLight) {
            bodyElement.classList.add('light-theme');
            themeToggleButton.textContent = darkThemeIcon;
            if (hljsThemeLink) hljsThemeLink.href = lightHljsThemeUrl;
            localStorage.setItem('theme', 'light');
        } else {
            bodyElement.classList.remove('light-theme');
            themeToggleButton.textContent = lightThemeIcon;
            if (hljsThemeLink) hljsThemeLink.href = darkHljsThemeUrl;
            localStorage.setItem('theme', 'dark');
        }
    }

    // Check local storage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

    // Initialize theme based on saved preference or system preference
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        setTheme(true);
    } else {
        setTheme(false); // Default to dark
    }


    // Add click listener to the button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const isCurrentlyLight = bodyElement.classList.contains('light-theme');
            setTheme(!isCurrentlyLight);
        });
    }
    // --- End Theme Toggle Logic ---

    // --- Auth Modal Logic ---
    console.log('Setting up auth modal...'); // Debug log
    const signInButton = document.getElementById('signInButton');
    const authModal = document.getElementById('authModal');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authTabContents = document.querySelectorAll('.auth-tab-content');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const googleAuthBtn = document.getElementById('googleAuthBtn');
    const authError = document.getElementById('authError');

    console.log('Sign In Button:', signInButton); // Debug log
    console.log('Auth Modal:', authModal); // Debug log

    // Open auth modal
    if (signInButton) {
        signInButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Sign In button clicked!'); // Debug log
            console.log('Auth modal element:', authModal); // Debug log

            // Show the modal
            authModal.classList.add('active'); // Use class to control visibility and opacity
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            // Focus first element when modal opens, with a slight delay for transition
            setTimeout(() => {
                const firstFocusable = authModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
                trapFocus(authModal); // Apply focus trapping
            }, 150); // Delay should be similar to CSS transition time
        });
    }

    // Close auth modal
    function closeModal() {
        authModal.classList.remove('active'); // Use class to control visibility and opacity
        document.body.style.overflow = ''; // Restore scrolling
        clearAuthErrors();
        // Optionally, return focus to the button that opened the modal
        if (document.activeElement === authModal || authModal.contains(document.activeElement)) {
            if (signInButton) signInButton.focus();
            else if (mobileSignInButton) mobileSignInButton.focus();
        }
    }

    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeModal();
        }
    });

    // Handle tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            authTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}Tab`) {
                    content.classList.add('active');
                }
            });

            clearAuthErrors();
        });
    });

    // Form validation functions
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePassword(password) {
        return password && password.length >= 6;
    }

    function getPasswordStrength(password) {
        if (!password) return { strength: 0, text: 'Enter a password' };
        if (password.length < 6) return { strength: 1, text: 'Too short' };
        if (password.length < 8) return { strength: 2, text: 'Weak' };

        let score = 2;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score >= 5) return { strength: 4, text: 'Strong' };
        if (score >= 4) return { strength: 3, text: 'Good' };
        return { strength: 2, text: 'Fair' };
    }

    function showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}Error`);
        const inputElement = document.getElementById(fieldId);

        if (errorElement) {
            errorElement.textContent = message;
        }
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    function clearFieldError(fieldId) {
        const errorElement = document.getElementById(`${fieldId}Error`);
        const inputElement = document.getElementById(fieldId);

        if (errorElement) {
            errorElement.textContent = '';
        }
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }

    function clearAuthErrors() {
        // Clear all field errors
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });

        // Hide auth error alert
        authError.style.display = 'none';
    }

    function switchToLoginTab(email = '') {
        // Find and activate the login tab
        const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
        const registerTab = document.querySelector('.auth-tab[data-tab="register"]');
        const loginTabContent = document.getElementById('loginTab');
        const registerTabContent = document.getElementById('registerTab');

        if (loginTab && registerTab && loginTabContent && registerTabContent) {
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            loginTab.classList.add('active');

            // Add highlight effect to draw attention to the tab switch
            loginTab.classList.add('highlight');
            setTimeout(() => {
                loginTab.classList.remove('highlight');
            }, 600);

            // Update active content
            authTabContents.forEach(content => content.classList.remove('active'));
            loginTabContent.classList.add('active');

            // Pre-fill email if provided
            if (email) {
                const loginEmailInput = document.getElementById('loginEmail');
                if (loginEmailInput) {
                    loginEmailInput.value = email;
                    // Focus on password field since email is already filled
                    const loginPasswordInput = document.getElementById('loginPassword');
                    if (loginPasswordInput) {
                        setTimeout(() => {
                            loginPasswordInput.focus();
                            // Add a subtle highlight to the password field
                            loginPasswordInput.style.boxShadow = '0 0 0 2px rgba(66, 133, 244, 0.3)';
                            setTimeout(() => {
                                loginPasswordInput.style.boxShadow = '';
                            }, 1000);
                        }, 300);
                    }
                }
            }

            // Clear any existing errors
            clearAuthErrors();

            // Show a helpful message with the user's email
            setTimeout(() => {
                const message = email
                    ? `Welcome! Your account (${email}) is ready. Please enter your password to log in.`
                    : 'Your account is ready! Please enter your credentials to log in.';
                showAuthError(message, true);
            }, 400);
        }
    }

    function showAuthError(message, isSuccess = false) {
        const errorText = authError.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
            authError.className = isSuccess ? 'auth-error success' : 'auth-error';
            authError.style.display = 'flex';
        }
    }

    function setButtonLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');

        if (isLoading) {
            button.classList.add('loading'); // Add loading class for spinner visibility
            button.disabled = true;
        } else {
            button.classList.remove('loading'); // Remove loading class
            button.disabled = false;
        }
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthErrors();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const submitBtn = loginForm.querySelector('.auth-submit-btn');

            let hasErrors = false;

            // Validate email
            if (!email) {
                showFieldError('loginEmail', 'Email is required');
                hasErrors = true;
            } else if (!validateEmail(email)) {
                showFieldError('loginEmail', 'Invalid email address');
                hasErrors = true;
            } else {
                clearFieldError('loginEmail');
            }

            // Validate password
            if (!password) {
                showFieldError('loginPassword', 'Password is required');
                hasErrors = true;
            } else {
                clearFieldError('loginPassword');
            }

            if (hasErrors) return;

            // Real login process
            setButtonLoading(submitBtn, true);

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                // Store user data
                window.currentUser = data;
                updateUIForLoggedInUser(data);

                showAuthError('Login successful! Welcome back.', true);
                setTimeout(() => {
                    closeModal();
                }, 1500);

            } catch (error) {
                console.error('Login error:', error);
                showAuthError(error.message || 'Login failed. Please try again.');
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // Handle register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthErrors();

            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const submitBtn = registerForm.querySelector('.auth-submit-btn');

            let hasErrors = false;

            // Validate email
            if (!email) {
                showFieldError('registerEmail', 'Email is required');
                hasErrors = true;
            } else if (!validateEmail(email)) {
                showFieldError('registerEmail', 'Invalid email address');
                hasErrors = true;
            } else {
                clearFieldError('registerEmail');
            }

            // Validate password
            if (!password) {
                showFieldError('registerPassword', 'Password is required');
                hasErrors = true;
            } else if (!validatePassword(password)) {
                showFieldError('registerPassword', 'Password must be at least 6 characters');
                hasErrors = true;
            } else {
                clearFieldError('registerPassword');
            }

            // Validate confirm password
            if (!confirmPassword) {
                showFieldError('confirmPassword', 'Please confirm your password');
                hasErrors = true;
            } else if (password !== confirmPassword) {
                showFieldError('confirmPassword', 'Passwords do not match');
                hasErrors = true;
            } else {
                clearFieldError('confirmPassword');
            }

            if (hasErrors) return;

            // Real registration process
            setButtonLoading(submitBtn, true);

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Registration failed');
                }

                // Clear the registration form
                registerForm.reset();

                // Show success message
                showAuthError('Account created successfully! Please log in with your new credentials.', true);

                // Switch to login tab after a brief delay
                setTimeout(() => {
                    switchToLoginTab(email);
                }, 1500);

            } catch (error) {
                console.error('Registration error:', error);
                showAuthError(error.message || 'Registration failed. Please try again.');
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // Handle Google authentication
    if (googleAuthBtn) {
        googleAuthBtn.addEventListener('click', async () => {
            clearAuthErrors();

            try {
                googleAuthBtn.style.opacity = '0.7';
                googleAuthBtn.disabled = true;

                // Import Firebase functions dynamically
                const { mockGoogleSignIn } = await import('./firebase-config.js');

                // Use mock Google sign-in for demo (replace with real Firebase in production)
                const user = await mockGoogleSignIn();
                const idToken = await user.getIdToken();

                // Send token to backend for verification
                const response = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ idToken })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Google authentication failed');
                }

                // Store user data
                window.currentUser = data;
                updateUIForLoggedInUser(data);

                showAuthError('Google authentication successful! Welcome to AI-SuperProductivity.', true);
                setTimeout(() => {
                    closeModal();
                }, 1500);

            } catch (error) {
                console.error('Google auth error:', error);
                showAuthError(error.message || 'Google authentication failed. Please try again.');
            } finally {
                googleAuthBtn.style.opacity = '1';
                googleAuthBtn.disabled = false;
            }
        });
    }

    // Handle Enter key navigation between form fields
    function setupFormNavigation() {
        // Login form navigation
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');

        if (loginEmail && loginPassword) {
            loginEmail.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    loginPassword.focus();
                }
            });
        }

        // Register form navigation
        const registerEmail = document.getElementById('registerEmail');
        const registerPassword = document.getElementById('registerPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        if (registerEmail && registerPassword) {
            registerEmail.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    registerPassword.focus();
                }
            });
        }

        if (registerPassword && confirmPassword) {
            registerPassword.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmPassword.focus();
                }
            });
        }
    }

    setupFormNavigation();

    // Clear errors when user starts typing
    function setupErrorClearing() {
        const inputs = document.querySelectorAll('.auth-form input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const fieldId = input.id;
                clearFieldError(fieldId);

                // Also hide the general auth error when user starts correcting
                if (authError.style.display === 'flex') {
                    authError.style.display = 'none';
                }
            });
        });
    }

    setupErrorClearing();

    // Setup password strength indicator
    function setupPasswordStrength() {
        const passwordInput = document.getElementById('registerPassword');
        const strengthIndicator = document.getElementById('passwordStrength');
        const strengthFill = strengthIndicator?.querySelector('.strength-fill');
        const strengthText = strengthIndicator?.querySelector('.strength-text');

        if (passwordInput && strengthIndicator && strengthFill && strengthText) {
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const strength = getPasswordStrength(password);

                if (password.length > 0) {
                    strengthIndicator.style.display = 'block';
                    strengthFill.className = `strength-fill strength-${strength.strength}`;
                    strengthText.textContent = strength.text;
                } else {
                    strengthIndicator.style.display = 'none';
                }
            });
        }
    }

    setupPasswordStrength();

    // Handle Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Focus management for accessibility
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });

        // Focus first element when modal opens
        if (firstElement) {
            firstElement.focus();
        }
    }

    // Apply focus trapping when modal opens via desktop button
    // signInButton.addEventListener('click', () => { // This listener is now combined with the open logic
    // setTimeout(() => {
    // trapFocus(authModal);
    // }, 100);
    // });

    // Handle mobile sign in button
    const mobileSignInButton = document.getElementById('mobileSignInButton');
    console.log('Mobile Sign In Button:', mobileSignInButton); // Debug log
    if (mobileSignInButton) {
        mobileSignInButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Mobile Sign In button clicked!'); // Debug log
            // Close mobile menu first using the existing closeNav function
            closeNav();

            // Then open auth modal
            authModal.classList.add('active'); // Use class to control visibility and opacity
            document.body.style.overflow = 'hidden';

            // Focus first element when modal opens, with a slight delay for transition
            setTimeout(() => {
                const firstFocusable = authModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
                trapFocus(authModal); // Apply focus trapping
            }, 150); // Delay should be similar to CSS transition time
        });
    }
    // --- End Auth Modal Logic ---

    // --- User State Management ---

    // Function to update UI when user is logged in
    function updateUIForLoggedInUser(user) {
        // Update sign in button to show user info or logout option
        if (signInButton) {
            signInButton.textContent = 'Logout';
            signInButton.onclick = handleLogout;
        }

        // Update mobile sign in button
        if (mobileSignInButton) {
            mobileSignInButton.textContent = 'Logout';
            mobileSignInButton.onclick = handleLogout;
        }

        console.log('User logged in:', user);
    }

    // Function to update UI when user is logged out
    function updateUIForLoggedOutUser() {
        if (signInButton) {
            signInButton.textContent = 'Sign In';
            signInButton.onclick = (e) => {
                e.preventDefault();
                authModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    const firstFocusable = authModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                    trapFocus(authModal);
                }, 150);
            };
        }

        if (mobileSignInButton) {
            mobileSignInButton.textContent = 'Sign In';
            mobileSignInButton.onclick = (e) => {
                e.preventDefault();
                closeNav();
                authModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    const firstFocusable = authModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                    trapFocus(authModal);
                }, 150);
            };
        }

        window.currentUser = null;
        console.log('User logged out');
    }

    // Handle logout
    async function handleLogout(e) {
        e.preventDefault();

        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                updateUIForLoggedOutUser();
                // Optional: Show logout success message
                console.log('Logged out successfully');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Check if user is already logged in on page load
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include'
            });

            if (response.ok) {
                const user = await response.json();
                window.currentUser = user;
                updateUIForLoggedInUser(user);
            } else {
                updateUIForLoggedOutUser();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            updateUIForLoggedOutUser();
        }
    }

    // Check auth status on page load
    checkAuthStatus();

}); // End DOMContentLoaded
