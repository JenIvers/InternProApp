# InternPro Technical Documentation (Gemini Context)

This document provides an overview of the InternPro application's architecture, features, and technical standards as of February 2026.

## 🚀 Overview
**InternPro** is a specialized Internship Portfolio Management system designed for educational leadership candidates (specifically tailored for Bethel University). It enables users to track professional hours, align activities with state/national competencies, manage artifacts, and generate professional reports for accreditation.

## 🛠 Tech Stack
- **Frontend:** React 19 (TypeScript)
- **Styling:** Tailwind CSS (CDN-based for prototype) with custom Glassmorphism/Liquid UI.
- **Backend/DB:** Firebase Firestore (Data Persistence)
- **Auth:** Firebase Google Authentication
- **Icons:** Lucide-React
- **Build Tool:** Vite

## 📁 Key Components & Architecture

### Core Views (`/components`)
- **Dashboard.tsx:** Visual overview of progress, cumulative hours, and institutional setting toggles.
- **LogsView.tsx:** The primary engine for activity tracking. Includes:
  - Log entry form with Title/Overview and Professional Description.
  - Competency tagging system.
  - **Professional Export Report:** High-end academic PDF/Print generation with consolidated stats and chronological history.
- **CompetenciesView.tsx:** Detailed breakdown of state standards with reflection inputs and attainment level tracking (Emerging to Exemplary).
- **ArtifactsView.tsx:** File/Link management for evidence, organized by virtual "Shelves".
- **SitesView.tsx:** Management of internship sites (Primary, Secondary, Alternate) and mentors.

### Services
- **authService.ts:** Handles Google Auth (Popup & Redirect) and session state.
- **firestoreService.ts:** Manages the `intern_data` collection, syncing the entire `AppState` object.
- **storageService.ts:** (In progress) Placeholder for Firebase Storage integration.

## 📝 Data Models (`types.ts`)
The application uses a centralized `AppState` interface that represents the user's entire portfolio. Key models include:
- `InternshipLog`: Includes `title`, `activity`, `hours`, `schoolLevel`, and `taggedCompetencyIds`.
- `Artifact`: Metadata for evidence files.
- `Competency`: Standard definitions for leadership standards.

## 📊 Features & Workflow
1. **Entry:** User logs an activity, provides a concise **Title** for the report and a detailed **Description** for personal notes.
2. **Alignment:** User tags the entry with specific **Competencies**.
3. **Synthesis:** Hours are automatically aggregated by **Institutional Context** (Elementary, Middle, etc.).
4. **Export:** The "Export Report" feature generates a strictly formatted, academic-style document for university submission, excluding personal descriptions and UI elements.

## 🏗 Deployment & Versioning
- **CI/CD:** GitHub Actions workflows for Firebase Hosting.
- **Versioning:** Semantic versioning via Git Tags.
- **Current Version (Feb 2026):** v1.1.3 (Professional Report Overhaul).

---
*Maintained by Gemini CLI Agent*
