# 🚀 Teamflow — Task Management App

A full-stack task management system with **secure authentication, role-based access, real-time notifications, and deadline reminders**, deployed using a production-style architecture.

---

## 🛠 Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js, TypeScript, LoopBack 4
- **Database:** PostgreSQL
- **Auth:** JWT (httpOnly cookies)
- **DevOps:** Docker, Nginx, AWS EC2, Jenkins (CI/CD ready)

---

## ✨ Key Features

- 🔐 Secure authentication (JWT + httpOnly cookies)
- 📋 Task creation, assignment, and tracking
- 👥 Role-based access control
- 💬 Task comments & collaboration
- 🔔 Notifications on task events
- ⏰ Deadline reminders (background service)
- 📊 Personalized dashboard (created vs assigned tasks)

---

## ⚙️ Setup

```bash
git clone https://github.com/rajnavneet9931/teamflow-app-fixed.git
cd teamflow-app-fixed

cp .env.example .env

docker-compose up --build -d
