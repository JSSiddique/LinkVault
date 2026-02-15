# 1. Setup Instructions

## Prerequisites
- Node.js
- npm
- MongoDB
- Firebase storage bucket + service account

## Backend Setup
1. Go to `./backend`
2. Install dependencies: `npm install`
3. Create/update `backend/.env` with `MONGO_URI`, `FIREBASE_STORAGE_BUCKET`, and `AUTH_TOKEN_SECRET`.
4. Start backend using `node src/app.js`

## Frontend Setup
1. Go to `frontend/`.
2. Install dependencies: `npm install`
3. Start frontend: `npm run dev`

# 2. API Overview

Base URL: `http://localhost:3000`

## Auth Endpoints
- `POST /api/auth/register` : `{ email, password }` -> `{ token, user }`
- `POST /api/auth/login` : `{ email, password }` -> `{ token, user }`
- `GET /api/auth/me` : Requires Bearer Token; returns profile

## Upload Endpoints (Authenticated)
- `POST /api/upload` : Upload content (text/file)
- `GET /api/list` : List current user's uploads
- `DELETE /api/upload/:shareId` : Delete owned upload

## Public View Endpoints
- `GET /api/view/:shareId` : Preview metadata
- `GET /api/view/:shareId/consume` : Access content (increments view count)

# Design Decisions
- React is used for the frontend because it allows the user interface to be built using reusable components. This makes the code structured, modular, and easier to maintain.
- Tailwind CSS is used for styling because it provides utility-based classes that help in designing responsive and consistent layouts quickly. It reduces the need for writing separate CSS files.
- Node.js with Express is used for the backend because it is lightweight and suitable for building REST APIs. It handles asynchronous operations efficiently and integrates well with MongoDB.
- MongoDB is used as the database because upload data can vary between file and text. A document-based database allows flexible storage without strict table structure limitations.
- JWT (JSON Web Tokens) is used for authentication to ensure secure communication between the frontend and backend. It enables protected routes without maintaining server-side sessions.
- Firebase Storage is used for storing files instead of saving them directly in the database. This improves performance and keeps the database lightweight.
- The project is structured with separate frontend and backend folders to maintain clear separation of concerns and better organization.

# Assumptions and Limitations
- This app is built for regular users only. There are no admin or team roles.
- Login uses tokens. There is no server-side logout list to instantly block old tokens.
- Shared links can be opened by anyone who has the link. Password is optional.
- Links stop working after they expire or when they hit the max view limit.
- The project is currently set up for localhost. Production setup (HTTPS, domain, etc.) still needs to be done.
