# 🚀 Teamflow — Team Task Management Application

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org)
[![LoopBack 4](https://img.shields.io/badge/LoopBack-4-red)](https://loopback.io)
[![AWS](https://img.shields.io/badge/Deployed%20on-AWS-orange?logo=amazonaws)](https://aws.amazon.com)

> A full-stack team productivity application for creating, assigning, and tracking tasks — with real-time notifications, deadline reminders, and secure role-based access.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Endpoints](#-api-endpoints)
  - [Users & Authentication](#users--authentication)
  - [Tasks](#tasks)
  - [Comments](#comments)
  - [Notifications](#notifications)
  - [Reminders](#reminders)
- [Authentication Design](#-authentication-design)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Security](#-security)

---

## ✨ Features

- 🔐 **Secure Authentication** — JWT stored in httpOnly cookies (XSS-safe)
- 📋 **Task Management** — Create, assign, update, and delete tasks
- 👥 **Role-Based Access** — Creators can edit everything; assignees can only update status
- 💬 **Commenting** — Threaded comments on tasks with author-only delete
- 🔔 **Notifications** — Instant alerts when tasks are assigned or deleted
- ⏰ **Deadline Reminders** — Background service polls every 5 min and warns 24h before deadlines
- 🔍 **Scoped Views** — Dashboard shows "Created by Me" and "Assigned to Me" separately
- 📖 **OpenAPI Explorer** — Interactive API docs at `/explorer`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), JSX, CSS |
| **Backend** | Node.js 18+, TypeScript, LoopBack 4 |
| **Database** | PostgreSQL 15 |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` |
| **ORM / Repository** | LoopBack 4 Repository (loopback-connector-postgresql) |
| **Deployment** | AWS (EC2 / Elastic Beanstalk) |

---

## 📁 Project Structure

```
Teamflow-app/
├── backend/                    # LoopBack 4 API Server
│   ├── src/
│   │   ├── application.ts      # App bootstrap, CORS, auth config
│   │   ├── index.ts            # Entry point, starts server + DeadlineNotifier
│   │   ├── sequence.ts         # Request middleware sequence
│   │   ├── controllers/        # Route handlers (HTTP layer)
│   │   │   ├── user.controller.ts
│   │   │   ├── tasks.controller.ts
│   │   │   ├── comment.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   └── reminder.controller.ts
│   │   ├── models/             # Data shape definitions
│   │   │   ├── user.model.ts
│   │   │   ├── task-model.model.ts
│   │   │   ├── comment-model.model.ts
│   │   │   ├── notification.model.ts
│   │   │   └── reminder.model.ts
│   │   ├── repositories/       # DB query layer
│   │   ├── datasources/        # PostgreSQL connection config
│   │   │   └── db.datasource.ts
│   │   └── services/
│   │       ├── cookie-jwt.strategy.ts    # Custom httpOnly cookie auth
│   │       └── deadline-notifier.service.ts  # Background poller
│   ├── .env                    # Environment variables (never commit!)
│   └── package.json
│
└── frontend/                   # React App (Vite)
    └── src/
        ├── App.jsx             # Routes
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx   # My Tasks view
        │   ├── CreateTask.jsx
        │   ├── TaskDetail.jsx  # Comments, status updates
        │   └── Reminders.jsx
        ├── components/
        │   └── NotificationBell.jsx
        └── services/
            └── api.js          # Axios/fetch API calls
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **PostgreSQL** v14 or higher (running locally or on a server)

### Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=teamflow_db

# JWT Secret (use a long, random string in production)
JWT_SECRET=your_super_secret_key_here

# Node Environment
NODE_ENV=development

# CORS (frontend URL in production)
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ **Never commit your `.env` file to Git.** It is already in `.gitignore`.

### Running Locally

**1. Clone the repository**
```bash
git clone https://github.com/your-username/Teamflow-app.git
cd Teamflow-app
```

**2. Set up and start the Backend**
```bash
cd backend
npm install
npm run build
npm start
# API is running at http://localhost:3000
# API Explorer at http://localhost:3000/explorer
```

**3. Set up and start the Frontend**
```bash
cd ../frontend
npm install
npm run dev
# Frontend at http://localhost:5173
```

**4. Set up the Database**

Create a PostgreSQL database named `teamflow_db` and run the migration script:
```bash
cd backend
npm run migrate
```

---

## 📡 API Endpoints

Base URL (local): `http://localhost:3000`


> 🔒 Routes marked with **[Auth]** require a valid session cookie (`token`). Login first to obtain one.

---

### Users & Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/users` | ❌ | **Register** a new user account |
| `POST` | `/users/login` | ❌ | **Login** — validates credentials, sets httpOnly JWT cookie |
| `POST` | `/users/logout` | ❌ | **Logout** — clears the session cookie |
| `GET` | `/users/me` | 🔒 [Auth] | Returns the currently logged-in user's profile |
| `GET` | `/users` | 🔒 [Auth] | Returns all registered users (used for task assignment) |
| `GET` | `/users/{id}` | 🔒 [Auth] | Get a specific user by ID |
| `PATCH` | `/users/{id}` | 🔒 [Auth] | Update a user's details |
| `DELETE` | `/users/{id}` | 🔒 [Auth] | Delete a user account |

**Register — Request Body:**
```json
POST /users
{
  "name": "Nitin Chauhan",
  "email": "nitin@valuefy.com",
  "password": "MyPass@123"
}
```

**Login — Request Body:**
```json
POST /users/login
{
  "email": "nitin@valuefy.com",
  "password": "MyPass@123"
}
```

**Login — Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": { "id": 1, "email": "nitin@valuefy.com", "name": "Nitin Chauhan" }
}
```

---

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/tasks` | 🔒 [Auth] | **Create** a new task (sets `createdBy` to current user) |
| `GET` | `/tasks` | 🔒 [Auth] | **Get my tasks** — only tasks I created OR am assigned to |
| `GET` | `/tasks/{id}` | 🔒 [Auth] | **Get a single task** (must be creator or assignee) |
| `PATCH` | `/tasks/{id}` | 🔒 [Auth] | **Update task** — creators edit all fields; assignees can only update `status` |
| `DELETE` | `/tasks/{id}` | 🔒 [Auth] | **Delete task** — creator only; notifies all assignees |
| `GET` | `/tasks/count` | 🔒 [Auth] | Returns the count of tasks visible to the current user |

**Create Task — Request Body:**
```json
POST /tasks
{
  "title": "Fix login bug",
  "description": "Users cannot log in on Safari",
  "status": "pending",
  "dueDate": "2026-04-10T00:00:00.000Z",
  "assignedTo": "[2, 4, 7]"
}
```
> `assignedTo` accepts a JSON array string `"[1,2,3]"` or the special value `"all"` to assign everyone.

**Task Status Values:** `pending` | `in_progress` | `completed`

---

### Comments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/comment-models` | 🔒 [Auth] | **Add a comment** to a task |
| `GET` | `/comment-models` | 🔒 [Auth] | **Get comments** (filter by `taskId`) |
| `GET` | `/comment-models/{id}` | 🔒 [Auth] | Get a single comment |
| `DELETE` | `/comment-models/{id}` | 🔒 [Auth] | **Delete a comment** (author only) |

**Add Comment — Request Body:**
```json
POST /comment-models
{
  "content": "Working on this now, will push a fix tonight.",
  "taskId": 12
}
```

---

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications` | 🔒 [Auth] | Get all notifications for the current user |
| `GET` | `/notifications/{id}` | 🔒 [Auth] | Get a single notification |
| `PATCH` | `/notifications/{id}` | 🔒 [Auth] | **Mark as read** (`isRead: true`) |
| `DELETE` | `/notifications/{id}` | 🔒 [Auth] | Delete a notification |

**Notification Types:**
- `task_assigned` — Someone assigned a task to you
- `task_deleted` — A task you were on was deleted
- `deadline` — A task's deadline is within 24 hours
- `reminder` — A manually set reminder has fired

**Mark as Read — Request Body:**
```json
PATCH /notifications/5
{
  "isRead": true
}
```

---

### Reminders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/reminders` | 🔒 [Auth] | **Create a reminder** for a task |
| `GET` | `/reminders` | 🔒 [Auth] | Get all your reminders |
| `GET` | `/reminders/{id}` | 🔒 [Auth] | Get a single reminder |
| `PATCH` | `/reminders/{id}` | 🔒 [Auth] | Update a reminder |
| `DELETE` | `/reminders/{id}` | 🔒 [Auth] | Delete a reminder |

**Create Reminder — Request Body:**
```json
POST /reminders
{
  "taskId": 12,
  "remindAt": "2026-04-09T09:00:00.000Z"
}
```

---

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/ping` | ❌ | Health check — returns `{ greeting: "Hello from LoopBack" }` |
| `GET` | `/explorer` | ❌ | Interactive OpenAPI/Swagger documentation |

---

## 🔐 Authentication Design

Teamflow uses **JWT (JSON Web Tokens)** stored in an **httpOnly cookie** for maximum security.

```
1. User logs in  →  Server creates a JWT (expires in 24h)
2. JWT is set as an httpOnly cookie named 'token'
3. Every request automatically sends the cookie to the server
4. Server reads & validates the cookie on every protected route
5. User logs out  →  Cookie is cleared from the browser
```

**Why httpOnly cookies instead of localStorage?**

| Storage | XSS Safe | Auto-sent | Recommended |
|---|---|---|---|
| `localStorage` | ❌ JavaScript can read it | Manual | ❌ |
| `httpOnly Cookie` | ✅ JavaScript cannot access it | Automatic | ✅ |

**Password Security:** All passwords are hashed using `bcrypt` with 10 salt rounds before being stored. The original password is never saved anywhere.

---

## 🗄 Database Schema

```
users               task_model              comment_model
─────────           ──────────────          ─────────────
id (PK)             id (PK)                 id (PK)
name                title                   content
email               description             taskId → task_model.id
password (hashed)   status                  userId → users.id
createdAt           dueDate                 createdAt
                    createdAt
                    createdBy → users.id    notification
                    assignedTo (JSON)       ────────────
                                            id (PK)
reminder                                    userId → users.id
────────                                    taskId → task_model.id
id (PK)                                     type
taskId → task_model.id                      message
userId → users.id                           isRead
remindAt                                    createdAt
isSent
createdAt
```

---

## ☁️ Deployment

The application is deployed on **AWS**:

| Component | AWS Service |
|---|---|
| Backend API | EC2 / Elastic Beanstalk |
| Frontend | S3 + CloudFront (or served from EC2) |
| Database | Amazon RDS (PostgreSQL) |

**Environment variables** in production are managed via **AWS Systems Manager Parameter Store** or **Secrets Manager** — never hardcoded.

---

## 🔒 Security

| Concern | Solution |
|---|---|
| Password storage | `bcrypt` hashing (salt rounds: 10) |
| Token XSS theft | `httpOnly` cookie — not readable by JavaScript |
| CSRF attacks | `sameSite: strict` cookie policy |
| Man-in-the-middle | `secure: true` cookie — HTTPS only in production |
| SQL Injection | LoopBack parameterised queries (no raw SQL concatenation) |
| Unauthorised access | `@authenticate('cookie-jwt')` decorator on all protected routes |
| Privilege escalation | Role checks on every mutation (e.g., only creator can delete) |
| Weak passwords | Server-side validation: 8+ chars, upper, lower, number, special char |

---

## 👨‍💻 Author

**Nitin Chauhan**

[LinkedIn](https://www.linkedin.com/in/nitin-chauhan13) · [GitHub](https://github.com/MrNitinChauhan)

---

## 📄 License

This project is part of an  assignment  and is not licensed for public distribution.