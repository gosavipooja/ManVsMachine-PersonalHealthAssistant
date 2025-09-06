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

## 📋 API Endpoints Overview

### Base URL: `http://localhost:3001/api`

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
  "bodyType": "mesomorph",
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
    "id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
    "name": "John Doe",
    "age": 28,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "bodyType": "mesomorph",
    "culture": "western",
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
    "id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
    "name": "John Doe",
    "age": 28,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "bodyType": "mesomorph",
    "culture": "western",
    "goals": ["lose weight", "build muscle", "improve health"],
    "activity_level": "moderate",
    "created_at": "2025-09-06T21:00:00Z"
  }
}
```

---

## 2. 📝 Logging API (Multi-Input Support)

### Create Text Log
```http
POST /api/logging
Content-Type: application/json

{
  "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
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
    "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
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
```http
POST /api/logging
Content-Type: multipart/form-data

user_id: 4b514588-a40b-4b8d-9236-8df8dcef25f7
timestamp: 2025-09-06T21:00:00Z
input_method: voice
file: [audio file - .wav, .mp3, .m4a]
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/logging \
  -F "user_id=4b514588-a40b-4b8d-9236-8df8dcef25f7" \
  -F "timestamp=2025-09-06T21:04:30Z" \
  -F "input_method=voice" \
  -F "file=@/path/to/audio.wav;type=audio/wav"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "db0110a5-9654-4516-b853-5492a192d006",
    "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
    "timestamp": "2025-09-06T21:04:30Z",
    "input_method": "voice",
    "file_name": "db0110a5-9654-4516-b853-5492a192d006.wav",
    "created_at": "2025-09-06T21:07:39.496Z",
    "file_size": 44,
    "content_preview": "Audio recording (0.0 KB)"
  },
  "message": "Log entry created successfully"
}
```

### Upload Photo Log
```http
POST /api/logging
Content-Type: multipart/form-data

user_id: 4b514588-a40b-4b8d-9236-8df8dcef25f7
timestamp: 2025-09-06T21:00:00Z
input_method: photo
file: [image file - .png, .jpg, .jpeg]
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/logging \
  -F "user_id=4b514588-a40b-4b8d-9236-8df8dcef25f7" \
  -F "timestamp=2025-09-06T21:01:30Z" \
  -F "input_method=photo" \
  -F "file=@/path/to/image.png"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "5265537e-2e98-4729-b355-9f3070d82684",
    "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
    "timestamp": "2025-09-06T21:01:30Z",
    "input_method": "photo",
    "file_name": "5265537e-2e98-4729-b355-9f3070d82684.png",
    "created_at": "2025-09-06T21:02:39.209Z",
    "file_size": 70,
    "content_preview": "Image file (0.1 KB)"
  },
  "message": "Log entry created successfully"
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

**Example:**
```http
GET /api/logging/4b514588-a40b-4b8d-9236-8df8dcef25f7?limit=10&input_method=text
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "log",
      "userId": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
      "timestamp": "2025-09-06T21:04:30Z",
      "id": "db0110a5-9654-4516-b853-5492a192d006",
      "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
      "input_method": "voice",
      "file_name": "db0110a5-9654-4516-b853-5492a192d006.wav",
      "created_at": "2025-09-06T21:07:39.496Z",
      "file_size": 44,
      "content_preview": "Audio recording (0.0 KB)"
    }
  ],
  "count": 3
}
```

### Get Today's Logs
```http
GET /api/logging/{userId}/today
```

### Download/View Log File
```http
GET /api/logging/file/{logId}
```

**Example:**
```http
GET /api/logging/file/e9bcd0e4-6f71-42bc-812c-e57f4575c232
```

Returns the actual file content with appropriate Content-Type headers.

### Get Logging Statistics
```http
GET /api/logging/stats/{userId}?days=30
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_logs": 3,
    "by_input_method": {
      "text": 1,
      "voice": 1,
      "photo": 1
    },
    "by_date": {
      "2025-09-06": 3
    }
  },
  "period_days": 30
}
```

### Delete Log Entry
```http
DELETE /api/logging/{logId}
```

**Response:**
```json
{
  "success": true,
  "message": "Log entry and associated file deleted successfully"
}
```

---

## 3. 🤖 AI Coaching API

### Get AI Coaching Advice
```http
POST /api/ai-coaching
Content-Type: application/json

{
  "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
  "query": "What should I eat for breakfast?",
  "context": "weight loss"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "advice": "For weight loss, consider a protein-rich breakfast...",
    "confidence": 0.85,
    "sources": ["nutrition guidelines", "fitness research"]
  }
}
```

---

## 4. 💬 Chat API

### Send Chat Message
```http
POST /api/chat
Content-Type: application/json

{
  "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
  "message": "Hello, I need help with my workout plan"
}
```

### Get Chat History
```http
GET /api/chat/{userId}
```

---

## 5. 📊 Dashboard API

### Get Dashboard Data
```http
GET /api/dashboard/{userId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_logs": 15,
      "streak_days": 7,
      "goals_completed": 3
    },
    "recent_activity": [...],
    "progress_metrics": {...}
  }
}
```

---

## 6. 🏃 Coaching API

### Get Coaching Plans
```http
GET /api/coaching/{userId}
```

### Create Coaching Plan
```http
POST /api/coaching
Content-Type: application/json

{
  "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
  "plan_type": "workout",
  "goals": ["build muscle", "lose weight"]
}
```

---

## 🗂️ Data Storage & Testing

### Where to Check Temporary Data During Testing

#### 1. **JSON Data Files** (Persistent Storage)
```
backend/data/
├── profile.json     # User profiles
├── log.json         # Logging entries metadata
├── chat.json        # Chat conversations
├── coaching.json    # Coaching plans
└── dashboard.json   # Dashboard data
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

#### 3. **Server Logs** (Console Output)
- Real-time API requests and responses
- File upload confirmations
- Error messages and debugging info
- Database operations

**Example Server Log Output:**
```
Server running on port 3001
::ffff:127.0.0.1 - - [06/Sep/2025:21:00:24 +0000] "POST /api/logging HTTP/1.1" 200 369 "-" "curl/7.81.0"
Saved 1 log documents to log.json
Document added: e9bcd0e4-6f71-42bc-812c-e57f4575c232 (type: log)
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
    "goals": ["gain weight", "build strength"]
  }'
```

### Test Text Logging
```bash
curl -X POST http://localhost:3001/api/logging \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "4b514588-a40b-4b8d-9236-8df8dcef25f7",
    "timestamp": "2025-09-06T21:00:00Z",
    "input_method": "text",
    "content": "Had a great workout today!"
  }'
```

### Test Voice Upload
```bash
# Create a sample WAV file first
printf 'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xAC\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00' > /tmp/sample.wav

# Upload the voice file
curl -X POST http://localhost:3001/api/logging \
  -F "user_id=4b514588-a40b-4b8d-9236-8df8dcef25f7" \
  -F "timestamp=2025-09-06T21:00:00Z" \
  -F "input_method=voice" \
  -F "file=@/tmp/sample.wav;type=audio/wav"
```

### Test Photo Upload
```bash
### Profile Field Options

The profile API now supports the following field options:

#### **gender**
- `male`
- `female`
- `other`

#### **culture** (UPDATED)
- `asian` - Asian cultural background
- `indian` - Indian cultural background
- `western` - Western cultural background
- `african` - African cultural background
- `european` - European cultural background
- `mediterranean` - Mediterranean cultural background

#### **bodyType** (UPDATED)
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

### Updated Profile Creation Example

```bash
curl -X POST http://localhost:3001/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Smith",
    "age": 28,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "bodyType": "athletic",
    "culture": "indian",
    "goals": ["lose weight", "build muscle", "improve health"],
    "activity_level": "moderate"
  }'
```

# Create a sample PNG file
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > /tmp/sample.png

# Upload the photo
curl -X POST http://localhost:3001/api/logging \
  -F "user_id=4b514588-a40b-4b8d-9236-8df8dcef25f7" \
  -F "timestamp=2025-09-06T21:00:00Z" \
  -F "input_method=photo" \
  -F "file=@/tmp/sample.png"
```

### Test Getting Logs
```bash
# Get all logs for a user
curl -X GET "http://localhost:3001/api/logging/4b514588-a40b-4b8d-9236-8df8dcef25f7"

# Get logs with filters
curl -X GET "http://localhost:3001/api/logging/4b514588-a40b-4b8d-9236-8df8dcef25f7?input_method=text&limit=5"

# Get statistics
curl -X GET "http://localhost:3001/api/logging/stats/4b514588-a40b-4b8d-9236-8df8dcef25f7?days=7"
```

### Test File Retrieval
```bash
# Download a text file
curl -X GET "http://localhost:3001/api/logging/file/e9bcd0e4-6f71-42bc-812c-e57f4575c232"

# Download an audio file
curl -X GET "http://localhost:3001/api/logging/file/db0110a5-9654-4516-b853-5492a192d006" --output downloaded_audio.wav

# Download an image file
curl -X GET "http://localhost:3001/api/logging/file/5265537e-2e98-4729-b355-9f3070d82684" --output downloaded_image.png
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

### MIME Type Validation
The API strictly validates file types:
- **Audio**: `audio/wav`, `audio/wave`, `audio/x-wav`, `audio/mpeg`, `audio/mp3`, `audio/mp4`, `audio/m4a`
- **Images**: `image/png`, `image/jpeg`, `image/jpg`

---

## 📁 Project Structure
```
backend/
├── data/              # JSON data storage
│   ├── profile.json   # User profiles
│   ├── log.json       # Log entries metadata
│   ├── chat.json      # Chat history
│   ├── coaching.json  # Coaching plans
│   └── dashboard.json # Dashboard data
├── routes/            # API route handlers
│   ├── profile.js     # Profile management
│   ├── logging.js     # Multi-input logging
│   ├── ai-coaching.js # AI coaching
│   ├── chat.js        # Chat functionality
│   ├── dashboard.js   # Dashboard data
│   └── coaching.js    # Coaching plans
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

### Common Error Examples

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation error",
  "message": "\"content\" is required"
}
```

**File Type Error:**
```json
{
  "success": false,
  "error": "File type application/octet-stream not allowed. Only audio (.wav, .mp3, .m4a) and image (.png, .jpg, .jpeg) files are supported."
}
```

**Not Found Error:**
```json
{
  "success": false,
  "error": "Log not found",
  "message": "No log entry found with this ID"
}
```

---

## 📈 Current Implementation Status

### ✅ **Fully Implemented & Tested:**
- **Profile Management API** - Create, read, update profiles
- **Logging API** - Multi-input support (text, voice, photo)
- **File Storage System** - Organized directory structure
- **Data Persistence** - JSON-based storage with metadata
- **File Upload/Download** - Multer-based file handling
- **Statistics API** - Usage analytics and metrics
- **Error Handling** - Comprehensive error responses
- **Validation** - Joi schema validation for all inputs

### 🔄 **Mock Implementation:**
- **AI Coaching API** - Returns mock responses
- **Chat API** - Basic structure in place
- **Dashboard API** - Template responses
- **Coaching API** - Basic CRUD operations

### 🚀 **Ready for Production:**
- All logging functionality with file storage
- Profile management
- Data persistence and retrieval
- File upload/download capabilities
- Statistics and analytics

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

### Common Issues & Solutions

**Server won't start:**
- Check if port 3001 is available
- Verify Node.js version compatibility
- Run `npm install` to ensure dependencies

**File upload fails:**
- Verify MIME type is supported
- Check file size (max 50MB)
- Ensure proper multipart/form-data encoding

**Data not persisting:**
- Check write permissions on `backend/data/` directory
- Verify JSON file structure isn't corrupted
- Look for server error logs

---

This documentation covers all implemented APIs with working examples and testing guidance. The logging API with file storage is fully functional and production-ready.