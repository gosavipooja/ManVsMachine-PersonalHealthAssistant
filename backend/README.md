# FitAura Personal Health Assistant - Backend API Documentation

## 🚀 Quick Start

### Prerequisites
- Node.js v12.22.9 or higher
- npm package manager

### Installation & Setup
```bash
# Install dependencies
npm install

# Start the server
node server.js
```

The server will start on `http://localhost:3001`

---

## 📋 Core API Endpoints

### Base URL: `http://localhost:3001/api`

The FitAura backend currently focuses on three core APIs that provide the essential functionality for the personal health assistant:

---

## 1. 👤 Profile Management API

### Create/Update Profile
```http
POST /api/profile
Content-Type: application/json

{
  "name": "John Doe",
  "age": 28,
  "gender": "male",
  "height": 175,
  "weight": 70,
  "bodyType": "athletic",
  "culture": "indian",
  "goals": ["lose weight", "build muscle", "improve health"],
  "activity_level": "moderate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "John Doe",
    "age": 28,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "bodyType": "athletic",
    "culture": "indian",
    "goals": ["lose weight", "build muscle", "improve health"],
    "activity_level": "moderate",
    "created_at": "2025-09-06T21:00:00Z"
  },
  "message": "Profile created successfully"
}
```

### Get Profile
```http
GET /api/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "John Doe",
    "age": 28,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "bodyType": "athletic",
    "culture": "indian",
    "goals": ["lose weight", "build muscle", "improve health"],
    "activity_level": "moderate",
    "created_at": "2025-09-06T21:00:00Z"
  }
}
```

### Profile Field Options

#### **gender**
- `male`
- `female`
- `other`

#### **culture**
- `asian` - Asian cultural background
- `indian` - Indian cultural background
- `western` - Western cultural background
- `african` - African cultural background
- `european` - European cultural background
- `mediterranean` - Mediterranean cultural background

#### **bodyType**
- `lean` - Lean body type
- `athletic` - Athletic body type
- `rounded` - Rounded body type

#### **activity_level**
- `very_light` - Minimal physical activity (desk job, little exercise)
- `light` - Light physical activity (light exercise 1-3 days/week)
- `moderate` - Moderate physical activity (moderate exercise 3-5 days/week)
- `vigorous` - Vigorous physical activity (hard exercise 6-7 days/week)
- `very_hard` - Very hard physical activity (very hard exercise, physical job)
- `max_effort` - Maximum effort physical activity (training twice a day, competitive athlete)

---

## 2. 📝 Logging API (Multi-Input Support)

### Create Text Log
```http
POST /api/logging
Content-Type: application/json

{
  "user_id": "emma_chen",
  "timestamp": "2025-09-06T21:00:00Z",
  "input_method": "text",
  "content": "Jogged 20 minutes in the park this morning. Felt great and energized!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "e9bcd0e4-6f71-42bc-812c-e57f4575c232",
    "user_id": "emma_chen",
    "timestamp": "2025-09-06T21:00:00Z",
    "input_method": "text",
    "file_name": "e9bcd0e4-6f71-42bc-812c-e57f4575c232.txt",
    "created_at": "2025-09-06T21:00:24.638Z",
    "content_preview": "Jogged 20 minutes in the park this morning. Felt great and energized!"
  },
  "message": "Log entry created successfully"
}
```

### Upload Voice Log

**Option 1: File Upload (multipart/form-data)**
```http
POST /api/logging
Content-Type: multipart/form-data

user_id: marcus_johnson
timestamp: 2025-09-06T21:00:00Z
input_method: voice
file: [audio file - .wav, .mp3, .m4a]
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/logging \
  -F "user_id=marcus_johnson" \
  -F "timestamp=2025-09-06T21:04:30Z" \
  -F "input_method=voice" \
  -F "file=@/path/to/audio.wav;type=audio/wav"
```

**Option 2: Base64 Content (application/json)**
```http
POST /api/logging
Content-Type: application/json

{
  "user_id": "marcus_johnson",
  "timestamp": "2025-09-06T21:00:00Z",
  "input_method": "voice",
  "content": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
  "file_type": "wav"
}
```

### Upload Photo Log

**Option 1: File Upload (multipart/form-data)**
```bash
curl -X POST http://localhost:3001/api/logging \
  -F "user_id=4b514588-a40b-4b8d-9236-8df8dcef25f7" \
  -F "timestamp=2025-09-06T21:01:30Z" \
  -F "input_method=photo" \
  -F "file=@/path/to/image.png"
```

**Option 2: Base64 Content (application/json)**
```http
POST /api/logging
Content-Type: application/json

{
  "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
  "timestamp": "2025-09-06T21:00:00Z",
  "input_method": "photo",
  "content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "file_type": "png"
}
```

### Get User's Logs
```http
GET /api/logging/{userId}
```

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50)
- `input_method` (optional): Filter by method (text, voice, photo)
- `start_date` (optional): Filter from date (ISO format)
- `end_date` (optional): Filter to date (ISO format)

### Get Today's Logs
```http
GET /api/logging/{userId}/today
```

### Download/View Log File
```http
GET /api/logging/file/{logId}
```

### Get Logging Statistics
```http
GET /api/logging/stats/{userId}?days=30
```

### Delete Log Entry
```http
DELETE /api/logging/{logId}
```

---

## 3. 💡 Insights API

### Get Personalized Insights
```http
GET /api/insights?userId={userId}&days={days}&includeRecommendations={boolean}
```

**Query Parameters:**
- `userId` (required): User ID to get insights for
- `days` (optional): Number of days to analyze (default: 1)
- `includeRecommendations` (optional): Include dinner recommendations (default: true)

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/insights?userId=4b514588-a40b-4b8d-9236-8df8dcef25f7&days=7&includeRecommendations=true"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Based on your recent activity logs, you've been consistently active with a good mix of cardio and strength training. Your energy levels seem high, and you're making great progress toward your weight loss and muscle building goals.",
    "dinnerRecommendation": "For tonight's dinner, I recommend grilled chicken breast with quinoa and roasted vegetables. This meal provides lean protein for muscle recovery, complex carbs for sustained energy, and plenty of nutrients to support your active lifestyle."
  },
  "metadata": {
    "userId": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
    "analysisTimeframe": "7 days",
    "generatedAt": "2025-09-06T22:30:00Z",
    "personalizationFactors": {
      "bodyType": "athletic",
      "culture": "indian",
      "goals": ["lose weight", "build muscle", "improve health"],
      "activityLevel": "moderate"
    }
  }
}
```

**Sample Response Scenarios:**

For detailed examples of different response scenarios, personalization factors, and error handling, see [`backend/data/insights-sample-response.json`](backend/data/insights-sample-response.json).

---

## 🗂️ Data Storage & Testing

### Where to Check Data During Testing

#### 1. **JSON Data Files** (Persistent Storage)
```
backend/data/
├── profile.json              # User profiles
├── log.json                  # Logging entries metadata
├── insights-sample-response.json  # Insights API documentation
└── [other data files]
```

**View Profile Data:**
```bash
cat backend/data/profile.json | jq
```

**View Log Data:**
```bash
cat backend/data/log.json | jq
```

#### 2. **Uploaded Files** (File Storage)
```
backend/uploads/
├── text/            # Text log files (.txt)
├── audio/           # Voice recordings (.wav, .mp3, .m4a)
└── images/          # Photo uploads (.png, .jpg, .jpeg)
```

**Check Uploaded Files:**
```bash
# List text files
ls -la backend/uploads/text/

# List audio files
ls -la backend/uploads/audio/

# List image files
ls -la backend/uploads/images/

# View text file content
cat backend/uploads/text/e9bcd0e4-6f71-42bc-812c-e57f4575c232.txt
```

---

## 🧪 Testing Examples

### Test Profile Creation
```bash
curl -X POST http://localhost:3001/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "age": 25,
    "gender": "female",
    "height": 165,
    "weight": 60,
    "bodyType": "lean",
    "culture": "mediterranean",
    "goals": ["gain weight", "build strength"],
    "activity_level": "moderate"
  }'
```

### Test Text Logging
```bash
curl -X POST http://localhost:3001/api/logging \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "emma_chen",
    "timestamp": "2025-09-06T21:00:00Z",
    "input_method": "text",
    "content": "Had a great workout today!"
  }'
```

### Test Insights API
```bash
# Get insights for the last 7 days
curl -X GET "http://localhost:3001/api/insights?userId=user123&days=7&includeRecommendations=true"

# Get insights for today only
curl -X GET "http://localhost:3001/api/insights?userId=user123&days=1"
```

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your-openai-key-here
```

### Supported File Types & Limits
- **Audio**: .wav, .mp3, .m4a (max 50MB)
- **Images**: .png, .jpg, .jpeg (max 50MB)
- **Text**: Plain text content (max 5000 characters)

---

## 📁 Core Project Structure
```
backend/
├── data/              # JSON data storage
│   ├── profile.json   # User profiles
│   ├── log.json       # Log entries metadata
│   └── insights-sample-response.json  # Insights API documentation
├── routes/            # Core API route handlers
│   ├── profile.js     # Profile management
│   ├── logging.js     # Multi-input logging
│   └── insights.js    # Personalized insights
├── services/          # Business logic services
│   ├── persistent-storage.js  # Data persistence
│   ├── mock-openai.js        # Mock AI service
│   └── memory-storage.js     # In-memory storage
├── uploads/           # File storage
│   ├── text/         # Text files (.txt)
│   ├── audio/        # Audio files (.wav, .mp3, .m4a)
│   └── images/       # Image files (.png, .jpg, .jpeg)
├── server.js          # Main server file
├── package.json       # Dependencies
└── README.md          # This documentation
```

---

## 🚨 Error Handling

All APIs return standardized error responses:
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors, missing fields)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server-side issues)

---

## 📈 Current Implementation Status

### ✅ **Fully Implemented & Tested:**
- **Profile Management API** - Create, read, update profiles with comprehensive validation
- **Logging API** - Multi-input support (text, voice, photo) with file storage
- **Insights API** - Personalized health insights with cultural and body-type awareness
- **File Storage System** - Organized directory structure with upload/download
- **Data Persistence** - JSON-based storage with metadata
- **Error Handling** - Comprehensive error responses
- **Validation** - Joi schema validation for all inputs

### 🚀 **Ready for Production:**
- All three core APIs are fully functional
- Complete file storage and retrieval system
- Personalized content generation
- Data persistence and analytics
- Comprehensive testing and documentation

---

## 🤝 Development & Testing Support

### Quick Health Check
```bash
# Test if server is running
curl http://localhost:3001/api/profile

# Should return profile data or empty response with 200 status
```

### Debugging Tips
1. **Check server console** for real-time API logs
2. **Inspect JSON files** in `backend/data/` for stored data
3. **Verify uploaded files** in `backend/uploads/` directories
4. **Use curl with `-v` flag** for verbose HTTP debugging
5. **Check file permissions** if upload fails

---

## 🔮 Future Development

<details>
<summary><strong>Click to expand Future APIs and Features</strong></summary>

### Future APIs (Not Currently Active)

#### 🤖 AI Coaching API
```http
POST /api/ai-coaching
Content-Type: application/json

{
  "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
  "query": "What should I eat for breakfast?",
  "context": "weight loss"
}
```

#### 💬 Chat API
```http
POST /api/chat
Content-Type: application/json

{
  "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
  "message": "Hello, I need help with my workout plan"
}
```

#### 📊 Dashboard API
```http
GET /api/dashboard/{userId}
```

#### 🏃 Coaching API
```http
GET /api/coaching/{userId}
POST /api/coaching
```

### Future Features
- Advanced AI coaching with OpenAI integration
- Real-time chat functionality
- Comprehensive dashboard analytics
- Personalized coaching plans
- Advanced data visualization
- Integration with wearable devices
- Social features and community support
- Advanced meal planning
- Workout video integration
- Progress tracking with photos
- Habit tracking and streaks
- Notification system
- Export/import functionality

### Future Data Storage
- Vector database integration (Weaviate)
- Advanced analytics and insights
- Machine learning model integration
- Real-time data processing
- Advanced search capabilities
- Data backup and recovery
- Multi-user support
- Role-based access control

</details>

---

This documentation covers the three core APIs that form the foundation of the FitAura Personal Health Assistant. All documented endpoints are fully functional and production-ready.