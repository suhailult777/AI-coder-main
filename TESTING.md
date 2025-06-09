# Testing Guide for AI-Coder with Authentication

This guide provides comprehensive testing instructions for the authentication system and overall functionality.

## 🧪 Testing Checklist

### Authentication System Testing

#### 1. User Registration

- [ ] **Valid Registration**

  - Enter a valid email (e.g., test@example.com)
  - Enter a password (minimum 6 characters)
  - Confirm password matches
  - Click "Create Account"
  - ✅ Should show success message: "Account created successfully! Please log in with your new credentials."
  - ✅ Should automatically switch to Login tab after 1.5 seconds
  - ✅ Should pre-fill the email field in the login form
  - ✅ Should focus on the password field with subtle highlight
  - ✅ Should show welcome message with user's email
  - ✅ Registration form should be cleared

- [ ] **Registration Validation**

  - Try empty email field → Should show "Email is required"
  - Try invalid email format → Should show "Invalid email address"
  - Try empty password → Should show "Password is required"
  - Try password < 6 characters → Should show "Password must be at least 6 characters"
  - Try mismatched passwords → Should show "Passwords do not match"

- [ ] **Duplicate Registration**
  - Try registering with same email twice
  - ✅ Should show "User already exists with this email"

#### 2. User Login

- [ ] **Valid Login**

  - Enter registered email and password
  - Click "Sign In"
  - ✅ Should show success message and log in

- [ ] **Invalid Login**
  - Try wrong email → Should show "Invalid email or password"
  - Try wrong password → Should show "Invalid email or password"
  - Try empty fields → Should show appropriate validation messages

#### 3. Google Authentication (Demo Mode)

- [ ] **Google Sign-In**
  - Click "Continue with Google"
  - ✅ Should simulate Google authentication and log in
  - ✅ Should show success message

#### 4. Session Management

- [ ] **Persistent Login**

  - Log in successfully
  - Refresh the page
  - ✅ Should remain logged in (button shows "Logout")

- [ ] **Logout**
  - Click "Logout" button
  - ✅ Should log out and button changes back to "Sign In"

### UI/UX Testing

#### 1. Modal Functionality

- [ ] **Opening Modal**

  - Click "Sign In" button → Modal should open
  - Click mobile menu "Sign In" → Modal should open

- [ ] **Closing Modal**

  - Click X button → Modal should close
  - Click outside modal → Modal should close
  - Press Escape key → Modal should close

- [ ] **Tab Switching**

  - Switch between "Login" and "Register" tabs
  - ✅ Forms should switch correctly
  - ✅ Errors should clear when switching tabs

- [ ] **Registration-to-Login Flow**
  - Complete a successful registration
  - ✅ Should see success message for 1.5 seconds
  - ✅ Should automatically switch to Login tab
  - ✅ Login tab should have highlight animation
  - ✅ Email field should be pre-filled with registered email
  - ✅ Password field should be focused with subtle highlight
  - ✅ Should show personalized welcome message
  - ✅ Should be able to immediately log in with new credentials

#### 2. Form Navigation

- [ ] **Keyboard Navigation**
  - Press Tab to navigate through form fields
  - Press Enter in email field → Should focus password field
  - Press Enter in password field (register) → Should focus confirm password

#### 3. Responsive Design

- [ ] **Desktop View** (1200px+)

  - Modal should be centered
  - All elements should be properly sized

- [ ] **Tablet View** (768px - 1199px)

  - Modal should adapt to screen size
  - Navigation should work properly

- [ ] **Mobile View** (< 768px)
  - Modal should be full-width with margins
  - Mobile menu should work
  - Forms should be touch-friendly

### Error Handling Testing

#### 1. Network Errors

- [ ] **Server Offline**

  - Stop the server
  - Try to log in
  - ✅ Should show appropriate error message

- [ ] **Invalid Responses**
  - Test with malformed server responses
  - ✅ Should handle gracefully

#### 2. Client-Side Validation

- [ ] **Real-time Validation**
  - Start typing in fields with errors
  - ✅ Errors should clear as user types

### Accessibility Testing

#### 1. Keyboard Navigation

- [ ] **Tab Order**

  - Tab through all interactive elements
  - ✅ Should follow logical order

- [ ] **Focus Management**
  - Modal opens → First input should be focused
  - Modal closes → Focus returns to trigger button

#### 2. Screen Reader Support

- [ ] **Labels and ARIA**
  - All form fields have proper labels
  - Error messages are announced
  - Modal has proper ARIA attributes

### Performance Testing

#### 1. Loading Times

- [ ] **Initial Load**

  - Page should load quickly
  - No blocking resources

- [ ] **Authentication Responses**
  - Login/register should respond within 2 seconds
  - Loading states should be visible

### Security Testing

#### 1. Password Security

- [ ] **Password Hashing**

  - Check server logs - passwords should never appear in plain text
  - User data file should contain hashed passwords only

- [ ] **Session Security**
  - Sessions should expire appropriately
  - No sensitive data in client-side storage

## 🐛 Common Issues and Solutions

### Issue: "Cannot connect to server"

**Solution**: Make sure the server is running with `npm run dev`

### Issue: "Google authentication not working"

**Solution**: This is expected in demo mode. For production, set up actual Firebase credentials.

### Issue: "Modal not opening"

**Solution**: Check browser console for JavaScript errors. Ensure all scripts are loaded.

### Issue: "Responsive design issues"

**Solution**: Test in different browsers and clear browser cache.

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
Screen Size: ___________

Authentication Tests:
- Registration: ✅/❌
- Login: ✅/❌
- Google Auth: ✅/❌
- Logout: ✅/❌

UI/UX Tests:
- Modal Functionality: ✅/❌
- Form Navigation: ✅/❌
- Responsive Design: ✅/❌

Error Handling: ✅/❌
Accessibility: ✅/❌
Performance: ✅/❌

Notes:
_________________________________
```

## 🚀 Automated Testing (Future Enhancement)

For production applications, consider adding:

- Unit tests for authentication functions
- Integration tests for API endpoints
- End-to-end tests with tools like Cypress or Playwright
- Performance testing with tools like Lighthouse
