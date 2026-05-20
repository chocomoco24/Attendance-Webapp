# Attendance App

A web-based classroom attendance system with camera verification, geolocation tracking, and MySQL database storage.

---

## Features

- Mark students as **Present** or **Absent** via roll number
- **Camera verification** — capture a photo when marking Present
- **Geolocation** — automatically fetches the user's location at the time of photo capture
- Attendance records stored in a **MySQL database**
- Table loads existing records from the database on page open
- "View Location" hyperlink in the table opens Google Maps at the captured coordinates

---

## Project Structure

```
attendance-app/
├── frontend/
│   ├── index2.html       # Main HTML structure
│   ├── script2.js        # Frontend logic (camera, geolocation, fetch API calls)
│   └── style2.css        # Styling (dark navy/amber theme)
├── backend/
│   └── server.js         # Express server + MySQL connection + API endpoints
├── package.json          # Node.js dependencies
└── README.md
```

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or above)
- [MySQL](https://www.mysql.com/) (v8 or above)
- A modern browser with camera and location permissions support

---

## Setup Instructions

### 1. Clone or download the project

```bash
git clone <your-repo-url>
cd attendance-app
```

### 2. Install dependencies

```bash
npm install
```

This installs `express`, `mysql2`, and `cors`.

### 3. Configure the database

Open `server.js` and update the connection details:

```js
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_mysql_username',
    password: 'your_mysql_password',
    database: 'your_database_name'
});
```

Make sure the database already exists in MySQL. The `attendance` table will be created automatically when the server starts.

### 4. Start the backend server

```bash
node server.js
```

You should see:
```
Connected to MySQL
Server running on port 3000
```

### 5. Open the frontend

Open `index2.html` directly in your browser.

---

## How to Use

1. Enter a **roll number** in the input field
2. Click **Present** or **Absent**
3. If Present:
   - Click **Open Camera**
   - Click **Capture Photo** — this triggers location fetch (a loading overlay will appear)
   - Wait for the overlay to disappear (location fetched)
4. Click **SUBMIT**
   - The record is saved to MySQL
   - The table refreshes from the database

---

## API Endpoints

| Method | Endpoint      | Description                        |
|--------|---------------|------------------------------------|
| POST   | `/attendance` | Insert a new attendance record     |
| GET    | `/attendance` | Fetch all attendance records       |

### POST `/attendance` — Request Body

```json
{
    "roll": "101",
    "status": "Present",
    "locationUrl": "https://www.google.com/maps?q=26.1445,91.7362"
}
```

---

## Database Schema

```sql
CREATE TABLE attendance (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    roll_number  VARCHAR(20),
    status       VARCHAR(10),
    location_url TEXT
);
```

---

## Behavior Notes

- Capture button is only enabled when **both** Present is selected **and** the camera is open
- If location access is denied by the browser, submission is blocked and the form resets
- Absent students get a `—` in the Location column (no location required)
- Present students without a captured location cannot submit

---

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Frontend  | HTML, CSS, JavaScript   |
| Backend   | Node.js, Express        |
| Database  | MySQL                   |
| Fonts     | Syne, DM Mono (Google Fonts) |

---

## Known Limitations

- Geolocation accuracy depends on the device and browser permissions
- The app is intended for local/LAN use; deploying to production requires HTTPS (geolocation and camera APIs require a secure context)
- No authentication — anyone with access to the page can submit records
