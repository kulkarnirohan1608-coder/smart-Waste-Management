# Smart Waste Management System — Web Version

A beginner-friendly full-stack web prototype for a Smart Waste Management System.
This version is **web-only**: it uses simulated dustbin readings and sample waste records.
No ESP32, sensors, camera, or real-time hardware is required yet.

## Features
- Dashboard with total bins, full bins, collection requests, and waste statistics
- Dustbin list with fill percentage and status
- Add/edit/delete dustbins
- Collection request management and status updates
- Waste records and category breakdown
- Alerts generated for bins at or above 80% fill
- SQLite database with automatic demo-data seeding
- REST API built with Flask
- React + Vite frontend

## Tech stack
- Frontend: React, Vite, plain CSS
- Backend: Python, Flask, Flask-CORS
- Database: SQLite

## Requirements
- Windows 10/11
- Python 3.10+
- Node.js 18+ (LTS recommended)
- VS Code or Antigravity IDE

## 1. Start the backend

Open a terminal in the project folder:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

If PowerShell blocks activation, run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Backend runs at: http://127.0.0.1:5000
API health check: http://127.0.0.1:5000/api/health

## 2. Start the frontend

Open a **second terminal** in the project folder:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually http://localhost:5173.

## 3. Demo login
This prototype does not use authentication yet. Open the dashboard directly.
Authentication and role-based access can be added as a later phase.

## Project structure
```text
smart-waste-management-web/
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── requirements.txt
│   └── waste_management.db   (created automatically)
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       └── style.css
└── README.md
```

## API endpoints
- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/bins`
- `POST /api/bins`
- `PUT /api/bins/<id>`
- `DELETE /api/bins/<id>`
- `GET /api/collections`
- `POST /api/collections`
- `PATCH /api/collections/<id>`
- `GET /api/waste-records`
- `GET /api/alerts`

## Important limitations
- Bin fill levels are demo values stored in SQLite; they are not coming from physical sensors.
- Waste categories are sample records; image-based AI classification is not connected yet.
- Alerts are calculated from stored bin fill levels.
- This is a development prototype, not a production-ready public service. Add authentication, authorization, input validation, deployment hardening, and privacy controls before real use.

## Suggested next phases
1. Add login and admin/collector roles.
2. Add AI image upload and waste classification endpoint.
3. Connect ESP32 sensor readings to `PUT /api/bins/<id>`.
4. Add map view and route planning for collection teams.
5. Deploy backend and frontend.

## Login page (demo)

The frontend now opens with an EcoTrack administrator sign-in page. Use these demo credentials:

- Email: `admin@ecotrack.com`
- Password: `EcoTrack@123`

The demo sign-in is frontend-only and stores a session flag in the browser session storage. It is suitable for a classroom/project demonstration, **not production security**. For a real deployment, connect the login form to backend authentication and protect API endpoints.
