# MedFlow — Product Requirements Document

## Original Problem Statement
Build "MedFlow" — a Trauma-First Hospital Resource Management & Dynamic Capacity Allocation simulation platform. A React frontend that simulates a hospital network responding to trauma cases in real time. Sections: Dispatcher Console (3-column), Hospital Capacity Network, Patient Medical Footprint, Analytics.

## User Choices (2026-02)
- Existing React + Tailwind + shadcn/ui template (JavaScript)
- MongoDB backend persistence (whole-state snapshot document)
- Leaflet + OpenStreetMap tiles for incident map
- Dark-first theme with light toggle
- New patient intake collects medications + conditions and shows them in patient profile

## Architecture
- Frontend: React 19 + Zustand + Tailwind + shadcn/ui + Recharts + react-leaflet + sonner + framer-motion (available)
- Backend: FastAPI with 3 endpoints on /api/state (GET/PUT/DELETE) persisting a single MedFlow state document in MongoDB
- All simulation logic (classification, ranking, resource locking, redispatch) runs client-side in Zustand store; state persisted after every mutation

## What's Been Implemented (2026-02)
- Persistent global header with brand, live pulse, quick stats, action buttons, theme toggle
- Dispatcher Console 3-column layout: Intake, Live Terminal Dispatch Feed, Holding Queue + Recent Dispatches
- Deterministic keyword classifier (OB-GYN → Neurosurgeon → Trauma Surgeon → Burn → Ortho → General)
- Weighted hospital matcher (Critical vs non-Critical weight profiles) with distance/bed/specialist scoring + ICU preference for critical
- Atomic resource locking (beds, specialist availability, activePatients)
- Holding queue with priority sort + auto-redispatch on Discharge
- 5 seeded hospitals with deterministic capacity/equipment/waiting-area formulas
- Patient Portal: medication ledger CRUD + discontinue/reactivate, demo interaction rule engine, semantic alert badges
- Trauma intake captures new patient medications & conditions in a single flow
- Analytics tab with 5 Recharts (Crime vs imaging, Pregnancy vs OB, Senior scatter, Bed utilization, Dispatch distance)
- Simulate Surge (7 randomized cases) + Reset Simulation (confirm dialog)
- Toast notifications for dispatch, queue, discharge, reset events

## Prioritized Backlog
- P1: Zone-affinity nudge in matcher so OB-GYN cases prefer St. Jude's when tied
- P2: Playback of dispatch feed history per case (click a recent dispatch → replay lines)
- P2: Export analytics snapshot (CSV) of hospital state
- P2: Multi-patient linking to a single trauma case
- P3: Configurable simulation speed / seeded reproducible surge
