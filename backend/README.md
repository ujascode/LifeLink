# LifeLink Backend

Backend API for **LifeLink – Smart Hospital-to-Hospital Organ Exchange Platform**.

The backend provides secure REST APIs for administrator authentication, hospital registration and verification, organ management, and hospital-to-hospital organ requests.

## Run locally

1. Create `backend/.env` with `PORT`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`.
2. Install dependencies with `npm install`.
3. Start the API with `npm run dev` (or `npm start`).

The frontend should use `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.

## Main API groups

- `/api/auth` — hospital/admin login, registration, current user, password reset
- `/api/hospitals` — hospital profiles, verification, and hospital dashboard
- `/api/organs` — verified-hospital organ management and exchange search
- `/api/organ-requests` — request lifecycle: pending, accepted, rejected, cancelled, completed
- `/api/admin` — admin-only authoritative dashboard statistics and request reporting

All protected endpoints require `Authorization: Bearer <token>`. Passwords, JWT secrets, and database credentials belong in environment variables and must not be committed.

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- CORS
- dotenv
- Nodemon

---

## Project Structure

```text
backend/
│
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── hospitalController.js
│   │   ├── organController.js
│   │   └── organRequestController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   │
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Hospital.js
│   │   ├── Organ.js
│   │   └── OrganRequest.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── hospitalRoutes.js
│   │   ├── organRoutes.js
│   │   └── organRequestRoutes.js
│   │
│   └── server.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
