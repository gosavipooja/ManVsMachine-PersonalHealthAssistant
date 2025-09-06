# FitAura - Personal AI Health Coach

A comprehensive personal health assistant that uses AI coaching, Weaviate vector database, and multimodal input logging to help users build healthy micro-habits.

## 🚀 Features

- **AI-Powered Coaching**: Personalized health insights and motivation based on user profile and activity
- **Multimodal Logging**: Log activities via text, voice (speech-to-text), or photo upload
- **Weaviate Vector Database**: Intelligent storage and retrieval of health data with semantic search
- **Micro-Habit Tracking**: Focus on hydration and nutrition with progress visualization
- **Real-time Dashboard**: Track progress, streaks, and receive AI insights
- **Voice & Photo Recognition**: Advanced input methods for easy habit logging
- **PWA Support**: Install as a mobile app for offline access

## 🏗️ Architecture

```
Frontend (Next.js)          Backend (Node.js)           Vector DB (Weaviate)
├── Profile Setup           ├── Express API             ├── Health Data Storage
├── Habit Logging           ├── OpenAI Integration      ├── Semantic Search
├── Voice/Photo Input       ├── Weaviate Service        ├── User Context
├── Dashboard               ├── File Upload Handling    └── Coaching History
├── AI Chat Interface       └── Data Processing
└── PWA Features
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **Lucide React** - Icons
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **OpenAI API** - AI coaching
- **Weaviate** - Vector database
- **Multer** - File uploads
- **Joi** - Validation

### Database
- **Weaviate** - Vector database for semantic search and storage
- **Local Storage** - Client-side data persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Weaviate instance running
- OpenAI API key

### 1. Clone and Install
```bash
cd ManVsMachine-PersonalHealthAssistant
npm install
cd backend && npm install
```

### 2. Environment Setup
```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:
```env
OPENAI_API_KEY=your_openai_api_key_here
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=your_weaviate_api_key_here
```

### 3. Start Weaviate
```bash
# Using Docker
docker run -p 8080:8080 -p 50051:50051 \
  -e QUERY_DEFAULTS_LIMIT=25 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
  -v weaviate_data:/var/lib/weaviate \
  semitechnologies/weaviate:latest
```

### 4. Start Development Servers
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run backend

# Or run both together
npm run dev:full
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Weaviate: http://localhost:8080

## 📱 Usage

### 1. Profile Setup
- Enter personal information (age, gender, height, weight, body type, culture)
- Set health goals
- AI coach personalizes based on your profile

### 2. Habit Logging
- **Text**: Quick text input for activities
- **Voice**: Use speech-to-text for hands-free logging
- **Photo**: Upload food photos for automatic recognition

### 3. AI Coaching
- Daily motivational messages
- Personalized nutrition suggestions
- Progress insights and recommendations
- Interactive chat interface

### 4. Dashboard
- Track daily progress across habits
- View streaks and achievements
- Weekly progress visualization
- AI-generated insights

## 🔧 API Endpoints

### Profile
- `POST /api/profile` - Create/update profile
- `GET /api/profile/:userId` - Get user profile
- `GET /api/profile/:userId/insights` - Get personalized insights

### Logging
- `POST /api/logging` - Log activity
- `POST /api/logging/photo` - Upload photo for food recognition
- `GET /api/logging/:userId` - Get user logs
- `GET /api/logging/:userId/today` - Get today's logs

### Coaching
- `GET /api/coaching/:userId/motivation` - Get daily motivation
- `GET /api/coaching/:userId/nutrition` - Get nutrition suggestions
- `GET /api/coaching/:userId/insights` - Get comprehensive insights

### Dashboard
- `GET /api/dashboard/:userId` - Get dashboard data
- `GET /api/dashboard/:userId/habit/:habitId` - Get habit progress

### Chat
- `POST /api/chat/:userId/message` - Send message to AI coach
- `GET /api/chat/:userId/history` - Get chat history
- `GET /api/chat/:userId/suggestions` - Get contextual suggestions

## 🎯 Hackathon Features

### Core Features (MVP)
- ✅ User profile setup with personalization
- ✅ Hydration and nutrition tracking
- ✅ AI coaching with OpenAI integration
- ✅ Weaviate vector database for intelligent storage
- ✅ Voice and photo logging capabilities
- ✅ Real-time dashboard with progress tracking

### Advanced Features
- 🔄 Food recognition with photo upload
- 🔄 Voice-to-text logging
- 🔄 Streak tracking and gamification
- 🔄 PWA installation
- 🔄 Offline support

## 🏆 Demo Flow

1. **Landing Page** - Welcome screen with feature overview
2. **Profile Setup** - Quick onboarding with personal details
3. **Habit Logging** - Demonstrate text, voice, and photo input
4. **AI Coaching** - Show personalized insights and chat
5. **Dashboard** - Display progress, streaks, and analytics

## 🔮 Future Enhancements

- **Social Features**: Share progress with friends
- **Wearable Integration**: Connect with fitness trackers
- **Advanced Analytics**: Detailed health insights
- **Meal Planning**: AI-powered meal suggestions
- **Community**: Connect with other users
- **Health Professionals**: Connect with doctors/nutritionists

## 🤝 Contributing

This is a hackathon project! Feel free to:
- Add new features
- Improve the UI/UX
- Enhance AI prompts
- Add new integrations
- Optimize performance

## 📄 License

MIT License - feel free to use this project for your own hackathons and learning!

---

**Built with ❤️ for the hackathon by the FitAura team**