# FitAura - Personal AI Health Coach

A hackathon project featuring an AI-powered personal health assistant with cultural personalization and multimodal input logging.

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend && npm install

# Python (optional - for ML experiments only)
python3 -m venv hackathon-env
source hackathon-env/bin/activate
pip install openai python-dotenv requests Pillow SpeechRecognition
```

### 2. Set Environment Variables
```bash
cp env.example .env.local
# Add your OpenAI API key to .env.local
```

### 3. Start Weaviate (Vector Database)
```bash
docker run -p 8080:8080 -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true semitechnologies/weaviate:latest
```

### 4. Run the Application
```bash
npm run dev:full
```

## 🎯 Demo Flow

1. **Profile Setup** → Create user profile with cultural preferences
2. **Habit Logging** → Log activities via text, voice, or photo
3. **AI Coaching** → Get personalized, culturally-aware health insights
4. **Dashboard** → View progress and AI recommendations

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Node.js with Express
- **AI**: OpenAI GPT-4 with cultural personalization
- **Database**: Weaviate vector database
- **Storage**: Local storage + vector embeddings

## 📡 API Endpoints

- `POST /profile` - Create user profile
- `POST /log` - Log habit entry
- `GET /history` - Get user logs
- `POST /coach` - Get AI coaching feedback

## 🌍 Cultural Personalization

Supports 5+ cultural contexts:
- **Indian**: Ayurveda principles, Namaste greetings
- **Chinese**: TCM balance, qi energy concepts
- **Mexican**: Family-centered wellness
- **American**: Individual goal-focused approach
- **European**: Work-life balance emphasis

## 💪 Body Type Intelligence

- **Ectomorph**: Calorie-dense nutrition, strength training
- **Mesomorph**: Balanced approach, variety focus
- **Endomorph**: Portion control, regular cardio

## 🧪 Testing

```bash
# Test AI prompts
node test-ai-prompts.js

# Test spec compliance
node demo-spec.js
```

## 📁 Project Structure

```
├── app/                    # Next.js frontend
├── backend/               # Express API server
├── lib/                   # Shared utilities
├── types/                 # TypeScript definitions
├── hackathon-env/         # Python virtual environment (optional)
└── requirements.txt       # Python dependencies (optional)
```

## 🔧 Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, OpenAI API
- **Database**: Weaviate vector database
- **AI**: GPT-4 with advanced prompt engineering

## 🎉 Hackathon Features

- ✅ **Multimodal Input**: Text, voice, photo logging
- ✅ **AI Coaching**: Personalized, cultural-aware insights
- ✅ **Vector Search**: Intelligent data retrieval
- ✅ **Real-time Dashboard**: Progress tracking
- ✅ **Spec Compliance**: Exact API contract match

---

**Built for hackathon with ❤️ by the FitAura team**