## TaskFlow — Team Task Manager

A full-stack team task manager with role-based access control, built with FastAPI + SQLite (backend) and React + Vite (frontend).

---

## Live Demo
- **Frontend:** https://your-frontend.railway.app
- **Backend API:** https://your-backend.railway.app
- **API Docs:** https://your-backend.railway.app/docs

---

## Features

### Authentication
- JWT-based signup/login
- Protected routes (frontend + backend)
- Persistent sessions via localStorage

### Project Management
- Create/edit/delete projects
- Invite team members by email
- Assign roles: **Admin** (full control) or **Member** (limited)
- Per-project dashboard with task stats

### Task Management
- Create tasks with title, description, priority, due date, assignee
- Kanban board view (To Do / In Progress / Done)
- Status updates from board or list view
- Overdue task detection

### Dashboard
- Global stats: total tasks, by status, overdue count
- Recent projects and my assigned tasks
- Per-project stats

### Role-Based Access Control
| Action | Admin | Member |
|---|---|---|
| Create/delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Update any task | ✅ | ❌ |
| Update own tasks | ✅ | ✅ |
| Delete any task | ✅ | own only |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Frontend | React 18, Vite, React Router v6 |
| HTTP Client | Axios |
| UI | Custom CSS, Lucide React icons |
| Deployment | Railway |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API docs available at: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at: http://localhost:5173

The Vite dev server proxies `/api` calls to `localhost:8000`.

---

## Deployment on Railway

### Step 1 — Deploy Backend
1. Create a new Railway project
2. Add a service → Deploy from GitHub repo → select `backend/` folder
3. Set environment variables:
   - `SECRET_KEY` = any long random string
4. Deploy — Railway auto-detects Python via `nixpacks.toml`
5. Note the public backend URL (e.g. `https://taskflow-backend.railway.app`)

### Step 2 — Deploy Frontend
1. Add another service in the same Railway project → `frontend/` folder
2. Set environment variable:
   - `VITE_API_URL` = your backend URL from Step 1
3. Railway auto-runs `npm run build` and serves the `dist/` folder

### Step 3 — Update CORS (if needed)
If your frontend has a specific domain, update `main.py`:
```python
allow_origins=["https://your-frontend.railway.app"]
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Current user info |
| GET | /api/projects/ | List my projects |
| POST | /api/projects/ | Create project |
| GET | /api/projects/{id} | Get project detail |
| PUT | /api/projects/{id} | Update project (admin) |
| DELETE | /api/projects/{id} | Delete project (admin) |
| POST | /api/projects/{id}/members | Add member (admin) |
| DELETE | /api/projects/{id}/members/{uid} | Remove member (admin) |
| GET | /api/projects/{id}/dashboard | Project stats |
| GET | /api/tasks/ | List tasks (filterable) |
| POST | /api/tasks/ | Create task |
| GET | /api/tasks/my | My assigned tasks |
| GET | /api/tasks/overdue | Overdue tasks |
| GET | /api/tasks/dashboard | Global stats |
| PUT | /api/tasks/{id} | Update task |
| DELETE | /api/tasks/{id} | Delete task |
| GET | /api/users/ | List all users |

---

## Project Structure

```
taskmanager/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models.py            # DB models (User, Project, Task, Member)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── requirements.txt
│   ├── Procfile             # Railway start command
│   ├── nixpacks.toml        # Railway build config
│   ├── core/
│   │   └── security.py      # JWT, bcrypt, auth dependency
│   └── routers/
│       ├── auth.py          # /api/auth/*
│       ├── users.py         # /api/users/*
│       ├── projects.py      # /api/projects/*
│       └── tasks.py         # /api/tasks/*
└── frontend/
    ├── src/
    │   ├── api.js           # Axios instance with auth interceptor
    │   ├── App.jsx          # Router + protected routes
    │   ├── index.css        # Global design system
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   └── Layout.jsx   # Sidebar + outlet
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       ├── Dashboard.jsx
    │       ├── Projects.jsx
    │       ├── ProjectDetail.jsx  # Kanban board + members
    │       └── Tasks.jsx
    ├── vite.config.js
    └── .env.example
```

---

## Demo Video Script (2–5 min)
1. Show signup → auto-login to dashboard
2. Create a project → show it on Projects page
3. Add a team member by email → show Members tab
4. Create tasks with different priorities and due dates → show Kanban board
5. Update task status (drag-equivalent via status select)
6. Show overdue task highlighted in Tasks page
7. Show Dashboard stats updating in real-time
8. Login as a Member → show restricted actions (no Add Member button)
9. Show API docs at `/docs`
