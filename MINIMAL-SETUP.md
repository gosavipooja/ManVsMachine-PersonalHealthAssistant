# FitAura - Minimal Setup Guide

## 🎯 **Hackathon-Focused Minimal Dependencies**

This setup uses only the essential libraries needed for the hackathon demo, reducing complexity and installation time.

## 📦 **Minimal Dependencies**

### **Frontend (Next.js) - 8 Core Dependencies**
```json
{
  "next": "14.0.4",           // React framework
  "react": "^18.2.0",         // UI library
  "react-dom": "^18.2.0",     // DOM rendering
  "typescript": "^5.3.3",     // Type safety
  "tailwindcss": "^3.3.6",    // Styling
  "openai": "^4.20.1",        // AI integration
  "weaviate-ts-client": "^1.4.0", // Vector database
  "axios": "^1.6.2"           // HTTP client
}
```

### **Backend (Node.js) - 6 Core Dependencies**
```json
{
  "express": "^4.18.2",       // Web framework
  "cors": "^2.8.5",           // CORS handling
  "dotenv": "^16.3.1",        // Environment variables
  "openai": "^4.20.1",        // AI integration
  "weaviate-ts-client": "^1.4.0", // Vector database
  "uuid": "^9.0.1"            // ID generation
}
```

### **Python (Optional) - 5 Core Dependencies**
```
openai==4.20.1               # AI integration
python-dotenv==1.0.0         # Environment variables
requests==2.31.0             # HTTP client
Pillow==10.0.0               # Image processing
speechrecognition==3.10.0    # Voice recognition
```

## 🚀 **Quick Setup (5 Minutes)**

### **1. Install Node.js Dependencies**
```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### **2. Set Environment Variables**
```bash
# Copy and edit
cp env.example .env.local

# Add your OpenAI API key
echo "OPENAI_API_KEY=your_key_here" >> .env.local
```

### **3. Start Weaviate (Docker)**
```bash
# One-line Weaviate setup
docker run -p 8080:8080 -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true semitechnologies/weaviate:latest
```

### **4. Run the Application**
```bash
# Start both frontend and backend
npm run dev:full
```

## 🎯 **What's Included**

### **✅ Core Features**
- ✅ **User Profile Management**
- ✅ **Habit Logging** (text, voice, photo)
- ✅ **AI Coaching** with cultural personalization
- ✅ **Vector Database** for intelligent storage
- ✅ **Dashboard** with progress tracking
- ✅ **API Endpoints** (spec-compliant)

### **✅ Demo-Ready**
- ✅ **Profile Setup** → `POST /profile`
- ✅ **Food Logging** → `POST /log`
- ✅ **Exercise Logging** → `POST /log`
- ✅ **AI Feedback** → `POST /coach`
- ✅ **Progress Dashboard** → `GET /history`

## 🚫 **What's Removed (Minimal Approach)**

### **Removed Dependencies**
- ❌ **Framer Motion** (animations) → Use CSS transitions
- ❌ **React Hook Form** → Use basic forms
- ❌ **Zod** (validation) → Use basic validation
- ❌ **Recharts** → Use simple HTML/CSS charts
- ❌ **React Hot Toast** → Use basic alerts
- ❌ **Next PWA** → Basic web app
- ❌ **Multer** (file upload) → Use basic file handling
- ❌ **Joi** (validation) → Use basic validation
- ❌ **Rate Limiting** → Basic error handling

### **Simplified Features**
- 🔄 **Animations**: CSS-only transitions
- 🔄 **Forms**: Basic HTML forms with validation
- 🔄 **Charts**: Simple HTML/CSS progress bars
- 🔄 **Notifications**: Basic browser alerts
- 🔄 **File Upload**: Basic file handling
- 🔄 **Validation**: Simple JavaScript validation

## 📱 **Minimal Frontend Components**

### **Essential Pages**
```
app/
├── page.tsx              # Landing page
├── profile/page.tsx      # Profile setup
├── dashboard/page.tsx    # Progress dashboard
├── logging/page.tsx      # Habit logging
└── chat/page.tsx         # AI chat
```

### **Essential Components**
```
components/
├── ProfileForm.tsx       # Basic profile form
├── LoggingForm.tsx       # Basic logging form
├── Dashboard.tsx         # Simple dashboard
├── AIChat.tsx           # Basic chat interface
└── ProgressBar.tsx      # Simple progress bar
```

## 🔧 **Minimal Backend Structure**

### **Essential Routes**
```
routes/
├── profile.js           # Profile management
├── logging.js           # Habit logging
├── coaching.js          # AI coaching
└── spec-compliant.js    # Spec-compliant endpoints
```

### **Essential Services**
```
services/
├── openai.js            # AI integration
└── weaviate.js          # Vector database
```

## 🎯 **Hackathon Demo Flow**

### **1. Profile Setup** (30 seconds)
- Basic form with name, age, gender, body type
- Cultural selection dropdown
- Goals text input

### **2. Habit Logging** (1 minute)
- Text input for activities
- Voice recording (Web Speech API)
- Photo upload (basic file handling)

### **3. AI Coaching** (30 seconds)
- Personalized motivation messages
- Cultural-aware suggestions
- Body type specific advice

### **4. Dashboard** (30 seconds)
- Simple progress bars
- Activity history
- AI insights display

## 🚀 **Performance Benefits**

### **Faster Installation**
- **Before**: 45+ dependencies, 2-3 minutes
- **After**: 14 dependencies, 30 seconds

### **Smaller Bundle Size**
- **Before**: ~50MB node_modules
- **After**: ~15MB node_modules

### **Simpler Debugging**
- Fewer dependencies = fewer conflicts
- Easier to troubleshoot issues
- Faster development iteration

## 🔄 **Migration Path**

### **If You Need More Features**
```bash
# Add animations
npm install framer-motion

# Add form validation
npm install react-hook-form zod

# Add charts
npm install recharts

# Add PWA features
npm install next-pwa
```

### **Gradual Enhancement**
1. **Start**: Minimal setup for demo
2. **Enhance**: Add features as needed
3. **Scale**: Full production setup

## 📊 **Minimal vs Full Comparison**

| Feature | Minimal | Full | Demo Impact |
|---------|---------|------|-------------|
| **Dependencies** | 14 | 45+ | ✅ Faster setup |
| **Bundle Size** | 15MB | 50MB+ | ✅ Faster loading |
| **Setup Time** | 30s | 2-3min | ✅ Quick start |
| **Core Features** | ✅ All | ✅ All | ✅ Same demo |
| **Polish** | Basic | Advanced | 🔄 Demo works |

## 🎉 **Ready for Hackathon**

### **What You Get**
- ✅ **Working demo** in 5 minutes
- ✅ **All core features** functional
- ✅ **AI coaching** with personalization
- ✅ **Spec compliance** maintained
- ✅ **Easy to extend** if needed

### **What You Don't Need**
- ❌ Complex animations
- ❌ Advanced form validation
- ❌ Sophisticated charts
- ❌ PWA features
- ❌ Production optimizations

---

**Perfect for hackathon demos - maximum impact, minimum complexity!** 🚀
