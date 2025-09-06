# System Requirements

## 🖥️ Minimum Requirements
- **OS**: macOS 10.15+, Windows 10+, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Node.js**: Version 18.0.0 or higher
- **Docker**: For Weaviate vector database
- **Python**: 3.8+ (optional, for ML experiments only)

## 📦 Dependencies

### Frontend (8 core libraries)
- Next.js 14, React 18, TypeScript
- Tailwind CSS, OpenAI, Weaviate client
- Axios, Date-fns

### Backend (6 core libraries)
- Express, CORS, Dotenv
- OpenAI, Weaviate client, UUID

### Python (Optional - 5 core libraries)
- OpenAI, Python-dotenv, Requests
- Pillow, SpeechRecognition

## 🚀 Quick Setup

```bash
# Install Node.js dependencies
npm install && cd backend && npm install

# Set up Python environment (optional)
python3 -m venv hackathon-env
source hackathon-env/bin/activate
pip install -r requirements.txt

# Start Weaviate
docker run -p 8080:8080 -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true semitechnologies/weaviate:latest

# Run application
npm run dev:full
```

## 🔐 Required API Keys
- **OpenAI API Key**: For AI coaching functionality
- **Weaviate**: Free (self-hosted via Docker)

## 📱 Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Web Speech API, File API, Local Storage support