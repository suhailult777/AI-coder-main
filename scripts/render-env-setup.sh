#!/bin/bash
# Render Environment Variables Setup Script
# Run this script to set environment variables in Render CLI

echo "🔧 Setting up Render environment variables..."

# Required variables (update these values!)
render env set NODE_ENV production
render env set PORT 10000
render env set SESSION_SECRET "$(openssl rand -hex 32)"
render env set USE_DATABASE true
render env set RENDER_DEPLOYMENT true
render env set CORS_ORIGIN "https://ai-coder-frontend.netlify.app"

# API Keys (set these manually with your actual keys)
echo "⚠️  Please set these manually in Render dashboard:"
echo "   GEMINI_API_KEY=your-actual-gemini-api-key"
echo "   DATABASE_URL=postgresql://... (auto-set when linking database)"

# Optional Firebase variables
echo "📝 Optional Firebase variables (if using Google Auth):"
echo "   FIREBASE_PROJECT_ID=your-firebase-project-id"
echo "   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com"
echo "   FIREBASE_PRIVATE_KEY=your-firebase-private-key"

echo "✅ Basic environment variables set!"
echo "🔗 Complete setup in Render dashboard: https://dashboard.render.com"
