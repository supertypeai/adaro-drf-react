# Adaro Data Warehouse — Next.js Frontend

A modern Next.js 16 frontend for the Adaro water level monitoring dashboard, built with **Shadcn UI**, **Tailwind CSS v4**, **Chart.js**, and **Google Maps**.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Framework with Turbopack |
| Shadcn UI (dashboard-01) | Component library |
| Tailwind CSS v4 | Styling |
| Chart.js + react-chartjs-2 | Charting |
| @vis.gl/react-google-maps | Interactive maps |
| dayjs | Date utilities |
| jwt-decode | Auth token parsing |

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A valid **Google Maps API Key** (see below)

## Environment Variables

### `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (required)

This key enables the interactive Google Map on the dashboard.

**How to get it:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services → Library**
4. Enable these APIs:
   - **Maps JavaScript API**
   - **Maps Embed API** (optional, for the Map ID)
5. Go to **APIs & Services → Credentials**
6. Click **+ Create Credentials → API Key**
7. Copy the generated key
8. *(Recommended)* Click **Restrict Key** and limit to:
   - **Application restriction**: HTTP referrers → add `http://localhost:3000/*`
   - **API restriction**: Maps JavaScript API

> **Tip**: If you already have the key from the original CRA frontend (`REACT_APP_GOOGLE_MAPS_API_KEY`), it's the same key — just copy it.

### Do I need more environment variables?

**No.** The only env variable required is `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. The API backend URL (`https://adaro-data-warehouse.et.r.appspot.com`) is hardcoded in `src/services/api.ts`. If you need to point to a different backend (e.g. local), edit the `PATH` constant in that file.

## Do I need to run the backend?

**No** — the frontend connects to the **production backend** deployed on Google App Engine at `https://adaro-data-warehouse.et.r.appspot.com` by default. You do **not** need to run the Django backend locally.

**When to run the backend locally:**
- If you're developing backend features
- If the production backend is down
- If you want to test against local data

To run locally, edit `src/services/api.ts` and change:
```ts
const PATH = "https://adaro-data-warehouse.et.r.appspot.com";
// const PATH = "http://localhost:8000";  // ← uncomment this line
```

Then start the Django backend:
```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Google Maps API key

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

## App Routes

| Route | Description |
|---|---|
| `/` | Main dashboard: map, water level chart, V3 forecast chart + table |
| `/login` | Authentication page |
| `/<location-slug>` | Location detail (e.g. `/muara-tuhup`) with Real Data + Forecast tabs |
| `/google-data-studio` | Embedded Looker Studio report |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Root dashboard
│   ├── layout.tsx                # Root layout (dark mode, providers)
│   ├── login/page.tsx            # Login page
│   ├── [location]/page.tsx       # Dynamic location page
│   └── google-data-studio/page.tsx
├── components/
│   ├── app-header.tsx            # Navigation header
│   ├── dashboard-content.tsx     # 3-row dashboard layout
│   ├── map-section.tsx           # Google Maps with clickable markers
│   ├── all-locations-chart.tsx   # Multi-location line chart
│   ├── v3-performance-chart.tsx  # V3 forecast analysis (3 view modes)
│   ├── v3-performance-table.tsx  # V3 data table (Shadcn Table)
│   ├── location-data-view.tsx    # Real data tab
│   ├── location-forecast-view.tsx# Forecast tab
│   └── ui/                       # Shadcn UI components
├── providers/
│   ├── auth-provider.tsx         # JWT auth context
│   ├── location-provider.tsx     # Locations context + slug lookup
│   └── providers.tsx             # Combined wrapper
└── services/
    └── api.ts                    # API service (TypeScript)
```

## Building for Production

```bash
npm run build
npm start
```
