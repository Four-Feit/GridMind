# GridMind Developer Getting Started Guide

Welcome to GridMind! Follow this quick start guide to get your local environment running.

---

## 1. Prerequisites

- Python 3.10+ (Python 3.11 / 3.12 / 3.13 recommended)
- Git
- (Optional) Node.js 18+ if developing a frontend with Vite / React

---

## 2. Quick Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/Four-Feit/GridMind.git
cd GridMind
```

### Step 2: Create a Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On macOS / Linux
# or: .venv\Scripts\activate on Windows
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your configuration:
```env
LLM_API_KEY=your_api_key_here
LLM_MODEL=gemini-1.5-pro
API_HOST=0.0.0.0
API_PORT=8000
```
*(Note: You can run without an API key for development; `FakeLLM` is used by default for offline tests).*

---

## 3. Running the Test Suite

Run the full test suite across unit and integration tests:
```bash
python -m pytest
```

Run specific test layers:
```bash
python -m pytest backend/tests/unit -v
python -m pytest backend/tests/integration -v
```

---

## 4. Running the Backend Server

Start the FastAPI backend with hot-reloading:
```bash
python -m backend.main
```
The server will start at `http://localhost:8000`.
- Swagger API Docs: `http://localhost:8000/docs`
- WebSocket endpoint: `ws://localhost:8000/ws`

---

## 5. Git Branching Workflow

Each team member must work in their dedicated feature branch:
- **P1**: `git checkout -b feature/agent-core`
- **P2**: `git checkout -b feature/grid-simulator`
- **P3**: `git checkout -b feature/capabilities`
- **P4**: `git checkout -b feature/dashboard`
