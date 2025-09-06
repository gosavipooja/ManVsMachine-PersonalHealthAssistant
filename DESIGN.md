🏗️ Personal AI Micro-Habit Coach – Hackathon Design Template

1. System Overview

```
   Frontend (React/Next.js PWA)
   │
   └──> Backend API (Flask/Node.js)
   │
   ├──> AI Service (OpenAI API)
   ├──> Food/Voice Service (ML features)
   └──> Storage (local JSON or DB)
```

2. Data Models (Shared Spec)

```
   User Profile
   {
   "id": "user123",
   "name": "Alex",
   "age": 28,
   "gender": "male",
   "height_cm": 175,
   "weight_kg": 70,
   "body_type": "mesomorph",
   "culture": "western"
   }
```

Habit Log Entry

```
{
"id": "log789",
"user_id": "user123",
"timestamp": "2025-09-06T15:30:00Z",
"type": "exercise | food | hydration",
"input_method": "text | voice | photo",
"content": "Jogged 20 minutes"
}
```

AI Coach Feedback

```
{
"user_id": "user123",
"date": "2025-09-06",
"motivation_message": "Great job exercising today! Keep up the streak!",
"suggestions": [
"Add more protein to your meals.",
"Take a 10-min walk after lunch."
]
}
```

3. API Contract (Backend Endpoints)

`POST /profile`

- Input: User Profile JSON
- Output: { "status": "success" }

`POST /log`

- Input: Habit Log Entry JSON
- Output: { "status": "success" }

`GET /history?user_id=123&date=2025-09-06`

- Output: [ Habit Log Entries ]

`POST /coach`

- Input: { "user_id": "123", "date": "2025-09-06" }
- Backend Process: Fetch logs + profile → call AI service.
- Output: AI Coach Feedback JSON

4. Frontend Component Map

Profile Setup Page – Collect profile → `POST /profile`.

Habit Logger – Log exercise/food/hydration via text, voice, photo → `POST /log`.

Dashboard – `GET /history`, `GET /coach` → show progress & AI feedback.

Reminders – Local timer → in-app popup.

Chat Interface (Stretch) – `POST /coach` with query text.

5. Team Alignment
   Role Responsibilities
   Full Stack Dev Frontend UI (Profile, Logger, Dashboard, Reminders), integrate API calls
   ML Dev #1 AI Service – generate motivation messages & personalized suggestions via OpenAI API
   ML Dev #2 Voice & Photo input → structured log entries
   Backend Engineer Flask/Node backend – API endpoints, storage, integrate AI & ML services
6. Integration Flow

- Everyone develops against the JSON contracts.
- Backend starts with stubbed responses → replaced with real AI/ML later.
- Integration checkpoint at Hour 4: end-to-end test from profile → log → AI feedback → dashboard.

7. Demo Scenario (Guaranteed Path)

- Create profile (age, gender).
- Log food via text (“Pizza for lunch”).
- Log exercise via voice.
- Trigger reminder popup.
- Show dashboard progress.
- Show AI coach message:
  - “Great job logging 2 activities! Try adding a salad tomorrow.”
