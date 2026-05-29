# 🏥 HealthBuddy — AI-Powered Agentic Public Healthcare Assistant

> **Multilingual AI Healthcare Assistant** with symptom triage, facility locator, patient history, and real-time health analytics.

[![Built with AI](https://img.shields.io/badge/AI-GPT--4o-00d4aa?style=flat-square)](https://openai.com)
[![Languages](https://img.shields.io/badge/Languages-30+-00b4d8?style=flat-square)](/)
[![Maps](https://img.shields.io/badge/Maps-OpenStreetMap-7c3aed?style=flat-square)](https://www.openstreetmap.org)

---

## 🎯 What is HealthBuddy?

HealthBuddy is a **production-grade AI healthcare companion** that:

- 🧠 **AI Symptom Triage** — GPT-4o powered severity scoring (1-10) with confidence scores
- 🌍 **30+ Languages** — Hindi, English, Spanish, French, Arabic, Chinese, Tamil, Telugu, and more
- 🎤 **Voice Input** — Speak your symptoms in any supported language
- 🗺️ **Facility Locator** — Interactive Leaflet map with OpenStreetMap data
- 📊 **Health Analytics** — Symptom trends, severity tracking, and risk insights
- 📄 **PDF Reports** — Downloadable health history for doctor visits
- 👨‍⚕️ **Doctor Mode** — Dashboard for healthcare providers to review patient triages
- 🚨 **Emergency Detection** — Automatic red flag detection with emergency alerts

---

## ⚙️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│   Frontend   │────▶│  Express API GW   │────▶│  FastAPI AI    │
│  Vanilla JS  │     │  (Node.js)        │     │  (Python)      │
│  + Leaflet   │     │  + MongoDB        │     │  + GPT-4o      │
│  + jsPDF     │     │  + JWT Auth       │     │  + LangChain   │
└─────────────┘     └──────────────────┘     └───────────────┘
```

### Multi-Agent Pipeline
1. **Input Agent** — Text/Voice input with auto language detection
2. **Translation Agent** — Multilingual support (30+ languages)
3. **NLU Agent** — Symptom extraction, duration, severity keywords
4. **Triage Agent** — AI severity scoring with GPT-4o
5. **Decision Agent** — Home care / Doctor visit / Emergency classification
6. **Facility Locator Agent** — OpenStreetMap nearby hospital search
7. **Memory Agent** — Patient history timeline with analytics
8. **Response Agent** — Human-friendly responses in user's language

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Python 3.9+ (for AI service)
- OpenAI API key

### 1. Install & Run

```bash
# Install Node dependencies
npm install

# Seed admin/doctor accounts
npm run seed

# Start the server
npm run dev
```

### 2. Start AI Service (optional, for full AI triage)

```bash
cd ai_service
pip install -r requirements.txt
python main.py
```

### 3. Open in Browser

```
http://localhost:5000
```

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@healthbuddy.com | admin123 |
| Doctor | doctor@healthbuddy.com | doctor123 |

---

## 📱 Pages

| Page | URL | Description |
|------|-----|-------------|
| Auth | `/` | Login/Signup with animated particles |
| Chat | `/chat` | AI chat with voice input & triage |
| Dashboard | `/dashboard` | Health analytics & PDF reports |
| Map | `/map` | Interactive facility locator |
| Doctor | `/doctor` | Patient triage review dashboard |
| Admin | `/admin` | System stats & user management |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | OpenAI GPT-4o + LangChain |
| Backend | Express.js (Node.js) |
| AI Service | FastAPI (Python) |
| Database | MongoDB + Mongoose |
| Maps | Leaflet.js + OpenStreetMap |
| Auth | JWT + bcrypt |
| PDF | jsPDF (client-side) |
| Voice | Web Speech API |
| Frontend | Vanilla JS + CSS (no frameworks) |

---

## 🏆 Hackathon-Winning Features

- ✅ AI Confidence Score on every triage
- ✅ Doctor Mode Dashboard
- ✅ "Why This Matters" impact dashboard
- ✅ Real-time severity classification (Mild/Moderate/Emergency)
- ✅ Downloadable PDF health reports
- ✅ 30+ language support with voice input
- ✅ Rule-based fallback when AI service is offline
- ✅ Government API readiness (RESTful architecture)
- ✅ Emergency auto-alert system with banner

---

## 📄 License

MIT
