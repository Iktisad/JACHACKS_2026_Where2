# WhereTo

A real-time occupancy monitoring and study space finder for John Abbott College, built for the **JACHACKS ITS Challenge 2026**.

## Team

- Iktisad Rashid
- Mahimur Rahman Khan
- Fatema Ahsan Meem

## What It Does

- **Live Heatmaps** — Interactive floor plan overlays showing wireless client density per access point in the Library and Herzberg buildings, updated every 5 minutes
- **Historical Charts** — Time-series graphs and tables of campus-wide client counts over time
- **AI Study Spot Recommender** — Students describe their preferences (building, environment, session length) and the app recommends the best available space based on live occupancy data
- **Student & Admin Views** — Role-based UI: students get a mobile-friendly space finder; admins get a full dashboard with heatmaps and history analytics
- **PWA Support** — Installable as a mobile app on Android and iOS

## Tech Stack

### Frontend
| Library | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tooling |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| react-leaflet / Leaflet | Interactive floor plan maps |
| Recharts | Time-series occupancy charts |
| Lucide React | Icons |
| Motion (Framer Motion) | Animations |
| Radix UI | Accessible UI primitives |

### Backend
| Library | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| TypeScript + tsx | Type-safe server code |
| better-sqlite3 + Knex | Local SQLite database with migrations |
| node-cron | Scheduled polling of UniFi API every 5 minutes |
| @google/genai | Google Gemini API for AI recommendations |
| morgan | HTTP request logging |
| cors | Cross-origin request handling |

## AI Integration

The app integrates **Google Gemini** (`@google/genai` SDK). When a student submits their study preferences, the backend sends a structured prompt to Gemini that includes live occupancy data for all available spaces. Gemini returns a recommended space and a natural-language explanation for the suggestion.

## Data Source

Live data is pulled from the **UniFi Network API** on the JAC campus controller. The backend polls every 5 minutes via a cron job and stores snapshots in a local SQLite database, enabling both real-time views and historical trend analysis.

## Running the Project

```bash
# From the project root
npm install

# Install server and client dependencies
cd server && npm install
cd ../client && npm install

# Start both servers concurrently
cd .. && npm run dev
```
