# Vector Academy — Full-Stack Web Application

A modern, full-stack web application for Vector Academy featuring a public website, CMS admin panel, director's analysis dashboard, and student portal.

## Tech Stack

- **Frontend**: React, React Router, Tailwind CSS, React Icons, Axios, React Hot Toast
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
- **Fonts**: Inter (body), Poppins (headings)
- **Colors**: Primary `#27548A`, Background `#F4F6FF`

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB running locally or connection string

### Installation

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in separate terminal)
cd frontend
npm install
npm start
```

### Environment Variables

Create `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/vector-college
JWT_SECRET=your-secret-key
PORT=5000
```

## Application Routes

### Public Website
| Route | Description |
|-------|-------------|
| `/` | Homepage (Hero, Stats, About, Notices, Courses, Gallery, Testimonials, Contact, Footer) |

### CMS Admin Panel
| Route | Description |
|-------|-------------|
| `/vector-admin-login` | Admin login (manages website content) |
| `/admin` | Admin dashboard — Hero/Stats/Notices/Courses/Gallery/Testimonials/College Info |

### Academic Login (Students)
| Route | Description |
|-------|-------------|
| `/academic-login` | Student/Admin academic login (numeric ID + password) |
| `/student` | Student dashboard — marks, attendance, upcoming tests |

### Director's Analysis Portal
| Route | Description |
|-------|-------------|
| `/directors-batch/admin-login` | Director login (admin ID + password) |
| `/directors-batch` | Director dashboard — test creation, score entry, student analysis, rankings |

## Features

### Public Website
- Responsive homepage with dark blue hero, image carousel, typewriter animation
- Floating WhatsApp + Call buttons (9502818877)
- Count-up stat cards (scroll triggered)
- Alternating white / light-blue section backgrounds
- Admin-editable marquee section
- Contact form with WhatsApp integration

### CMS Admin Panel
- Manage Hero slideshow images (file upload from local storage)
- Edit marquee scrolling text items
- CRUD for Stats, Notices, Courses, Gallery, Testimonials
- Edit College Info (address, email, maps)

### Director's Analysis Dashboard
- **Test Creation**: Category presets (JEE Mains, NEET, General), subjects with topics, +4/-1 marking
- **Score Entry**: Correct/Wrong/Unattempted per subject, auto-calculated totals and accuracy
- **Student Analysis**: Attendance, performance bars, weak subjects, rank, test history
- **Filters**: All Students / Top 10 / Bottom 10

### Student Portal
- View subject-wise marks and overall average
- View attendance percentage and history
- View upcoming tests and syllabus

## API Endpoints

### Auth
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/verify` — Verify token

### Content (CMS)
- `GET/PUT /api/content/hero` — Hero section
- `GET/PUT /api/content/college-info` — College info
- `GET/POST /api/content/stats` — Stats CRUD
- `GET/POST /api/content/notices` — Notices CRUD
- `GET/POST /api/content/courses` — Courses CRUD
- `GET/POST /api/content/gallery` — Gallery CRUD
- `GET/POST /api/content/testimonials` — Testimonials CRUD
- `POST /api/upload/image` — Image upload

### Academic
- `GET/POST /api/academic/students` — Student profiles
- `GET/POST /api/academic/tests` — Tests CRUD
- `POST /api/academic/tests/:id/marks/bulk` — Bulk marks entry
- `POST /api/academic/attendance/batch` — Batch attendance
- `GET /api/academic/students/:id` — Student detail + analysis

## License

MIT
