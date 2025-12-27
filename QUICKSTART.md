# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Gemini API Key (2 minutes)

1. Visit [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google
3. Click "Get API key"
4. Copy your API key

### Step 2: Setup Backend (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file and add:
# - Your MySQL credentials
# - Your Gemini API key
# - A random JWT secret

# Create database and import schema
mysql -u root -p
CREATE DATABASE fakeai_db;
EXIT;
mysql -u root -p fakeai_db < database/schema.sql

# Start server
npm run dev
```

Server running at http://localhost:5000 ✅

### Step 3: Setup Android App (1 minute)

```bash
# Navigate to mobile
cd mobile

# Install dependencies
npm install

# Update API URL in src/services/api.js if needed
# Default is http://10.0.2.2:5000/api (works for Android emulator)

# Start Metro
npm start

# In another terminal, run Android app
npm run android
```

## 📱 Using the App

### First Time Setup

1. **Register Account**
   - Open app
   - Tap "Sign Up"
   - Enter name, email, password
   - Tap "Create Account"

2. **Add Your First Q&A**
   - Login as admin (email: admin@fakeai.com, password: admin123)
   - Tap "Admin" button
   - Go to "Q&A Pairs" tab
   - Tap microphone to speak question or type it
   - Tap microphone to speak answer or type it
   - Tap "Add Q&A Pair"

3. **Test the Chat**
   - Go back to Chat screen
   - Ask your question (type or speak)
   - Get your configured answer!
   - Unknown questions will use Gemini AI

## 🎤 Voice Features

- **Microphone Button** - Tap to start/stop recording
- **Auto TTS** - Responses are automatically read aloud
- **Multi-Language** - Automatically detects your language

## 👨‍💼 Admin Features

- **User Management** - Activate/deactivate users
- **Q&A Management** - Add, edit, delete Q&A pairs
- **Voice Entry** - Use voice for both questions and answers
- **Statistics** - View system stats

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check MySQL is running
sudo systemctl status mysql  # Linux
# or
brew services list  # Mac

# Check .env file has correct values
cat .env
```

### Android app can't connect
- Emulator: Use `http://10.0.2.2:5000/api`
- Physical device: Use `http://YOUR_COMPUTER_IP:5000/api`
- Make sure backend is running
- Check firewall settings

### Voice not working
- Grant microphone permission when prompted
- Check internet connection (required for speech recognition)
- Ensure Google Speech Services is installed

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for hosting options
- Customize the UI colors in screen files
- Add more Q&A pairs
- Change default admin password!

## 🆘 Need Help?

Common issues and solutions are in the README.md troubleshooting section.
