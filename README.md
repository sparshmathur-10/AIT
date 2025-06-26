# AI Task Manager

A minimal task management app with AI insights built with Django + React + PostgreSQL.

## Features

- Add, toggle, delete tasks
- AI-powered task analysis using GitHub DeepSeek
- Dark mode interface
- RESTful API

## Quick Start

### Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GitHub token

python manage.py runserver
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)

```bash
GITHUB_TOKEN=your_github_token_here
SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Tech Stack

- **Backend**: Django + Django REST Framework + SQLite
- **Frontend**: React + TypeScript + Material UI + Vite
- **AI**: GitHub DeepSeek R1

## API Endpoints

- `GET /api/tasks/` - List tasks
- `POST /api/tasks/` - Create task
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task
- `POST /api/analyze/` - AI task analysis (GitHub DeepSeek)
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration

## Usage

1. Add tasks using the input field
2. Check off completed tasks
3. Delete tasks with the trash icon
4. Click "AI Summary" for insights
