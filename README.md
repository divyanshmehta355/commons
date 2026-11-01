# Commons — Community-First Resource Sharing Platform

> **Share more. Waste less.**  
> *Built for modern neighborhoods, university campuses, and residential communities.*

Commons is an open-source, community-first resource-sharing platform that enables trusted groups to lend, borrow, and pool everyday items — tools, camping gear, textbooks, cameras, and appliances. Instead of every household buying duplicate items that sit idle, Commons turns local communities into collaborative lending libraries.

---

## 🌟 Key Features

- 📍 **Native Geo-Spatial Discovery**: Instant proximity-based search powered by Appwrite TablesDB native `point` and `polygon` spatial columns, with interactive OpenStreetMap/Leaflet integration.
- 🛡️ **Neighborhood Privacy Guard**: Strict coordinate fuzzing to 1-kilometer neighborhood centroids — exact residential street addresses are never collected, stored, or exposed.
- 🤝 **Verified QR Handover & Return**: Dynamic cryptographic QR verification for physical item exchange, condition check-ins, and return confirmation.
- 📦 **Curated Kits & Resource Bundles**: Bundle complementary items (e.g., *Weekend Camping Kit*, *Podcast Studio Kit*) into single-reservation packages.
- 🏆 **Community Sustainability Challenges**: Collective environmental impact trackers gamifying resource conservation (CO2 saved, waste diverted, money retained).
- 🔒 **Privacy-First & Zero AI Bloat**: Zero reliance on paid third-party APIs, zero invasive trackers, and 100% compliant with zero-cost deployment quotas.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with WCAG AAA accessible light palette
- **Backend & Database**: [Appwrite Cloud](https://appwrite.io/)
  - **Appwrite Auth**: Session management & SSR cookie verification
  - **Appwrite TablesDB**: Relational document storage with native `point` and `polygon` geo-spatial columns
  - **Appwrite Storage**: Resource media & condition inspection photo uploads
- **Spatial Engine**: Haversine distance calculations, ray-casting point-in-polygon & centroid resolution (`src/lib/geo/spatial.ts`)
- **Testing**: [Vitest](https://vitest.dev/) (59/59 passing unit & integration tests)
- **Package Manager**: `pnpm` exclusively

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v20+) and `pnpm` installed:
```bash
npm install -g pnpm
```

### 2. Environment Setup
Copy the example environment file and provide your Appwrite Cloud credentials:
```bash
cp .env.example .env.local
```

Required keys in `.env.local`:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6ae46daa000f4634f412
APPWRITE_API_KEY=your_server_api_key_here
APPWRITE_DATABASE_ID=commons
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=resource-media
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Run Test Suite
```bash
pnpm test
```
All 59 unit and integration tests across 14 test suites run automatically.

---

## 🎬 Hackathon Demo Accounts

To quickly test or record a demo with pre-seeded data:

| Account | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Alice Chen** | `alice.fictional@commons.demo` | `Password123!` | Community Admin (Open Campus) & Resource Lender |
| **Bob Martinez** | `bob.fictional@commons.demo` | `Password123!` | Community Member (Maple Residency) & Borrower |

For a step-by-step 3-minute hackathon video script and recording plan, see the [Hackathon Demo Guide](file:///C:/Users/devth/.gemini/antigravity/brain/2d13b99c-cfd8-44ee-b7d1-810167abc8ed/HACKATHON_DEMO_SCRIPT.md).

---

## 📄 License
MIT License. Built with ❤️ for community resilience and zero-waste living.
