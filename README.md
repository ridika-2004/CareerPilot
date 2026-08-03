# CareerPilot


### Your Agentic Career Co-pilot


*An AI-powered platform that knows you — hunts jobs, scores your fit, drafts your applications, and builds your learning roadmap.*


![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Google AI](https://img.shields.io/badge/Google_AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)


Built for **Codesprint 2026** · Powered by [Poridhi.io](https://poridhi.io)

[View Problem Statement](https://github.com/ridika-2004/CareerPilot/blob/main/Problem%20Statement.pdf)

<img width="953" height="412" alt="Screenshot 2026-06-07 200432" src="https://github.com/user-attachments/assets/ff5641d9-0b25-4654-8e27-3b39f3614676" />

## Overview


CareerPilot is an end-to-end agentic career platform built with **React** (frontend), **Django** (backend) and **MongoDB** (Database). It eliminates the fragmented job-search experience by combining a RAG-powered CV engine, an intelligent job hunter agent, a personal AI assistant, and a productivity tracker — all in one platform.


Every AI response is grounded in **your actual CV**, not hallucinated generic profiles.


## Features


### Pillar 1 — Job Hunter Agent


> <img align="right" width="400" src="client/src/assets/job%20hunter.png" />

- Natural language job search: *"Find me ML internships in Dhaka open this month"*
- Returns structured job cards: role, company, salary range, deadline, location, fit score
- Agent explains why each result matches your profile, grounded in your CV


### Pillar 2 — Profile & Resume Intelligence (RAG Core)

> <img align="right" width="400" src="client/src/assets/profile.png" />

- Upload a PDF/DOCX CV or build one directly in the platform
- CV is chunked by section: experience, education, skills, projects
- Chunks are embedded and stored in a vector database
- All downstream features — job matching, cover letters, gap analysis — query this store


### Pillar 3 — Personal AI Assistant

> <img align="right" width="400" src="client/src/assets/ai_assistent.png" />

- Conversational interface with full context of your profile
- Handles queries such as:
  - *"Am I ready for this data engineer role?"*
  - *"What skills am I missing for a Google internship?"*
  - *"Build me a 3-month roadmap to become job-ready"*
  - *"Draft a cover letter for this job posting"*


### Pillar 4 — Productivity & Progress Tracker

> <img align="right" width="400" src="client/src/assets/tracker.png" />

- **Calendar & To-Do**: Deadline reminders linked to career goals
- **Goal Setting**: Weekly/daily targets for applications, courses, and CV updates
- **Application Tracker**: Kanban board — Applied, Interviewing, Offer, Rejected
- **Progress Dashboard**: Applications sent, skills added, roadmap completion, streak counter
- **AI Nudges**: Proactive reminders based on your activity


## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS |
| Backend | Django 5, Django REST Framework |
| Database | MongoDB |
| AI / LLM | Google AI |


## Project Structure


```
careerpilot/
├── backend/
│   ├── careerpilot/          # Project settings
│   ├── accounts/             # User auth & profiles
│   ├── resume/               # CV upload, parsing, RAG pipeline
│   ├── jobs/                 # Job hunter agent
│   ├── assistant/            # AI chat assistant
│   ├── tracker/              # Kanban, goals, calendar
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route-level pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── api/              # API service layer
│   │   └── store/            # State management
│   └── package.json
│
└── README.md
```

## Local Setup


### Prerequisites


- Python 3.11+
- React.js 18+
- MongoDB (or cluster DB)
- API key for your chosen LLM provider


### 1. Clone the repository


```bash
git clone https://github.com/AfrinJahanEra/CareerPilot.git
cd careerpilot
```


### 2. Backend setup


```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```


Create a `.env` file inside `backend/`:


```env
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_URL=your_mongo_atlas_url
ADMIN_SECRET_KEY=ad123
GOOGLE_API_KEY=your_openai_api_key
```


Run migrations and start the server:


```bash
python manage.py migrate
python manage.py runserver
```


Backend runs at `http://localhost:8000`


### 3. Frontend setup


```bash
cd ../frontend
npm install
```


Create a `.env` file inside `frontend/`:


```env
VITE_API_BASE_URL=http://localhost:8000/api
```


Start the development server:


```bash
npm run dev
```


Frontend runs at `http://localhost:5173`


## Running Tests


```bash
# Backend
cd backend
python manage.py test


# Frontend
cd frontend
npm run test
```

## System Architecture
> <img width="1004" src="https://github.com/user-attachments/assets/0d98dc11-7eec-44d9-a0b5-9c41c8a61bd4" />


## Database Design
The application uses MongoDB with separate collections for users, resumes, jobs, applications, and career goals.
> <img width="200" align="right" src="https://github.com/user-attachments/assets/055e4ee9-e958-4213-aa71-2ed4bc0bcb35" />

### Collection Relationships

| Collection | Purpose |
|------------|---------|
| **Users** | Stores user accounts and profile information |
| **Resume Chunks** | Stores segmented resume content and vector embeddings for semantic search |
| **Jobs** | Stores job postings and company information |
| **Applications** | Tracks applications submitted by users and their status |
| **Goals** | Tracks users' career objectives and progress |

## Performance Optimization

> <img width="200" align="right" src="https://github.com/user-attachments/assets/a33ac856-02eb-45eb-964f-e821b923698a" />

To ensure the application remains fast, responsive, and scalable, several performance optimization techniques are incorporated into the system. Frequently requested data, such as job search results, AI-generated responses, and dashboard statistics, can be cached to minimize repeated database queries and API calls, significantly reducing response time and server load. Resource-intensive operations, including resume parsing, embedding generation, and job crawling, are designed to run asynchronously in the background so that users do not experience delays while interacting with the application. Additionally, database indexing is applied to commonly queried fields such as user IDs, application status, and deadlines, enabling faster search, filtering, and retrieval operations as the dataset grows. Together, these optimizations improve overall system performance, enhance the user experience, and support efficient scaling for a large number of users.

## Scaling Strategy of 10,000 Users

> <img width="1224" src="https://github.com/user-attachments/assets/bb280722-a6f4-43de-87e7-9202ee112a54" />


| Component | Scaling Strategy |
|-----------|------------------|
| **Frontend** | The React frontend is distributed through a Content Delivery Network (CDN) to serve static assets from locations closer to users. This reduces latency, improves page load times, lowers the load on the origin server, and provides a smoother experience for users across different regions. |
| **Backend** | Multiple backend application instances are deployed behind a load balancer to distribute incoming requests evenly. This horizontal scaling approach increases throughput, improves availability, provides fault tolerance, and allows additional instances to be added as user traffic grows. |
| **Database** | MongoDB is configured as a replica set consisting of one primary node and multiple secondary nodes. This architecture enables read scalability, automatic failover, and data redundancy, ensuring high availability and reliable performance under increased workloads. |
| **Vector Search** | Vector embeddings are stored separately from transactional application data to optimize semantic search operations. Isolating the vector database allows it to scale independently, reduces query latency, and provides faster similarity search without affecting the primary database. |

## Demo

[Watch the demo video](https://youtu.be/_1qxkC4VCvQ?si=u27XqwLVNoGgLB2t)


The demo covers this full flow: CV upload → job search → fit score → AI assistant query → cover letter draft → tracker update.


## License


This project is licensed under the [MIT License](LICENSE).
