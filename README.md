# FakeAI - AI-like Q&A Application

A multi-platform application (Android + Web) that provides a ChatGPT-like interface with voice capabilities, using user-configured Q&A pairs from a database with fuzzy matching and Gemini AI fallback.

## Features

- 🎤 **Voice Input** - Speak your questions using speech recognition
- 🔊 **Text-to-Speech** - Hear responses read aloud
- 🔍 **Fuzzy Matching** - Intelligent question matching using Fuse.js
- 🤖 **AI Fallback** - Gemini AI handles unknown questions
- 👤 **User-Specific Answers** - Each user has their own Q&A database
- 🔐 **Authentication** - Secure JWT-based authentication
- 👨‍💼 **Admin Panel** - Manage users and Q&A pairs
- 🌍 **Multi-Language** - Automatic language detection
- 📱 **Android App** - Native mobile experience with React Native
- 🌐 **Web App** - Modern web interface (coming soon)

## Project Structure

```
fakeAI/
├── backend/              # Node.js/Express API server
│   ├── config/          # Database and Gemini AI configuration
│   ├── database/        # SQL schema files
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic (matching, Gemini)
│   ├── utils/           # JWT utilities
│   └── server.js        # Main server file
│
└── mobile/              # React Native Android app
    ├── src/
    │   ├── screens/     # App screens (Login, Register, Chat, Admin)
    │   └── services/    # API, Voice, and TTS services
    └── App.js           # Main app with navigation
```

## Prerequisites

- **Node.js** 18+ and npm
- **MySQL** database
- **Gemini API Key** (free from Google AI Studio)
- **Android Studio** (for Android development)
- **React Native development environment** (for Android)

## Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and configure:
# - MySQL database credentials
# - JWT secret
# - Gemini API key (get from https://aistudio.google.com)
```

### 2. Database Setup

```bash
# Create MySQL database
mysql -u root -p

# In MySQL shell:
CREATE DATABASE fakeai_db;
exit;

# Import schema
mysql -u root -p fakeai_db < database/schema.sql
```

### 3. Start Backend Server

```bash
npm run dev
# Server will run on http://localhost:5000
```

### 4. Android App Setup

```bash
cd mobile

# Install dependencies
npm install

# Update API URL in src/services/api.js
# For Android emulator: http://10.0.2.2:5000/api
# For physical device: http://YOUR_COMPUTER_IP:5000/api
```

### 5. Run Android App

```bash
# Start Metro bundler
npm start

# In another terminal, run on Android
npm run android

# Or open in Android Studio:
# Open mobile/android folder in Android Studio
# Click Run button
```

## Getting Gemini API Key

1. Go to [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Accept the Terms of Service
4. Click "Get API key" or "Create API Key" in the top-right
5. Copy your API key and add it to backend/.env

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat/message` - Send message and get response

### Q&A Management
- `GET /api/qa` - Get all Q&A pairs for current user
- `POST /api/qa` - Create new Q&A pair
- `PUT /api/qa/:id` - Update Q&A pair
- `DELETE /api/qa/:id` - Delete Q&A pair

### Admin (Admin role required)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/activate` - Activate user
- `PUT /api/admin/users/:id/deactivate` - Deactivate user
- `GET /api/admin/stats` - Get system statistics

## Default Admin Account

- **Email**: admin@fakeai.com
- **Password**: admin123
- **⚠️ IMPORTANT**: Change this password after first login!

## How It Works

1. **User asks a question** (via text or voice)
2. **Fuzzy matching** searches user's Q&A database
3. **If match found** → Return user's configured answer
4. **If no match** → Query Gemini AI for response
5. **Response is displayed** and read aloud via TTS

## Voice Features

- **Multi-language support** - Automatically detects language
- **Voice input** - Tap microphone to speak your question
- **Text-to-speech** - Responses are automatically read aloud
- **Admin voice entry** - Add Q&A pairs using voice

## Deployment

### Backend Deployment

**Note**: Shared hosting typically doesn't support Node.js runtime. You'll need:
- **VPS** (IONOS, DigitalOcean, Linode, etc.)
- **Platform-as-a-Service** (Railway, Render, Heroku)
- **Serverless** (Vercel, AWS Lambda)

See `DEPLOYMENT.md` for detailed deployment instructions.

### Android App Deployment

1. Build release APK:
```bash
cd mobile/android
./gradlew assembleRelease
```

2. APK location: `mobile/android/app/build/outputs/apk/release/app-release.apk`

3. Sign and publish to Google Play Store (optional)

## Troubleshooting

### Backend Issues

**Database connection error**:
- Check MySQL is running
- Verify credentials in .env
- Ensure database exists

**Gemini API error**:
- Verify API key is correct
- Check internet connection
- Ensure you haven't exceeded free tier limits

### Android App Issues

**Cannot connect to server**:
- For emulator, use `http://10.0.2.2:5000/api`
- For physical device, use your computer's IP address
- Ensure backend server is running
- Check firewall settings

**Voice recognition not working**:
- Grant microphone permissions
- Check device has Google Speech Services installed
- Ensure internet connection (required for speech recognition)

**TTS not working**:
- Check device has TTS engine installed
- Go to Settings → Accessibility → Text-to-speech
- Select a TTS engine and download voice data

## Technologies Used

### Backend
- Node.js + Express
- MySQL (mysql2)
- JWT authentication
- Fuse.js (fuzzy matching)
- Google Gemini AI

### Mobile (Android)
- React Native 0.83
- React Navigation
- React Native Voice
- React Native TTS
- Axios
- AsyncStorage

## License

ISC

## Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.
