# 🎓 EduTrackPlus – Attendance Tracker & Academic Monitoring

EduTrackPlus is a **full‑stack educational platform** designed to manage **attendance, schedules, absences, replacements, statistics, and notifications** using a **polyglot database architecture**.

This project was developed as part of a **NoSQL / Web Engineering academic project**.

**Link :** [https://github.com/ElhaddajAya/projet-nosql-eduTrackPlus.git
](https://github.com/ElhaddajAya/projet-nosql-eduTrackPlus.git)

---

## 🚀 Main Features

### 👩‍🎓 Student

- View weekly schedule (date navigation)
- View attendance history
- View statistics (rate, streak, bonuses)
- Receive notifications (absence, replacement, bonus)

### 👨‍🏫 Teacher

- View personal schedule
- Mark attendance (individual & bulk)
- Declare absence with reason
- View teaching statistics

### 🧑‍💼 Admin

- Manage schedules (CRUD)
- Filter schedule by **class or teacher**
- Receive absence notifications
- Manage replacements (search, validate)
- Global statistics dashboard

---

## 🏗️ Architecture Overview

EduTrackPlus uses **4 databases**, each for a specific responsibility:

| Database    | Type       | Role                          |
| ----------- | ---------- | ----------------------------- |
| **MySQL**   | Relational | Core academic data            |
| **Redis**   | Key–Value  | Streaks & leaderboard         |
| **MongoDB** | Document   | Notifications & presence logs |
| **Neo4j**   | Graph      | Schedule & replacements logic |

---

## 🗄️ Databases – Usage Summary

### MySQL

- Users, classes, courses
- Sessions (seance), attendance (presence)
- Bonuses, replacements
  📁 `backend/src/config/mysql.js`

### Redis

- `streak:<id_etudiant>` (String)
- `last_present:<id_etudiant>` (String)
- `leaderboard:streaks` (ZSET)
  📁 `backend/src/config/redis.js`

### MongoDB

- Notifications (events)
- PresenceLog (historical snapshot of sessions)
  📁 `backend/src/models/Notification.js`

### Neo4j

- Nodes: Enseignant, Seance, Creneau, Salle, Classe
- Relations: TEACHES, REPLACES, TEACHES_TEMP
  📁 `backend/src/config/neo4j.js`

---

## 🔄 Key Usage Scenarios

### 1️⃣ Attendance with streak & bonus

1. Teacher marks attendance → **MySQL**
2. Streak updated → **Redis**
3. Bonus detected → **MySQL**
4. PresenceLog + notification → **MongoDB**
5. Stats refreshed → **Frontend**

---

### 2️⃣ Teacher absence & replacement

1. Teacher declares absence
2. Admin notified → **MongoDB**
3. Sessions marked _cancelled_ → **MySQL**
4. Available teachers searched → **Neo4j**
5. Admin validates replacement
6. Session updated → **MySQL**
7. Relations `REPLACES` & `TEACHES_TEMP` → **Neo4j**
8. Notifications sent → **MongoDB**

---

### 3️⃣ Multi‑database interaction: session creation

1. Session created → **MySQL**
2. Graph synchronized → **Neo4j**
3. Notifications generated → **MongoDB**
4. Schedule cache invalidated → **Redis**

---

## ▶️ Run the Project

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔮 Future Improvements

- AI‑based course recommendation
- Predictive attendance analytics
- Real‑time notifications
- Microservices architecture

---

## 🎤 Conclusion

EduTrackPlus illustrates a **realistic polyglot architecture**, where each database is used for what it does best:
**consistency (MySQL), performance (Redis), flexibility (MongoDB), and complex relations (Neo4j)**.
