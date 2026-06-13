# SentinelX

### AI-Powered Cyber Defense & Security Operations Platform

<p align="center">

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-24-green)
![SQLite](https://img.shields.io/badge/SQLite-Database-blue)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)
![Vite](https://img.shields.io/badge/Vite-Frontend-purple)
![Render](https://img.shields.io/badge/Render-Backend-black)
![Vercel](https://img.shields.io/badge/Vercel-Frontend-black)
![MIT License](https://img.shields.io/badge/License-MIT-yellow)

</p>

<p align="center">
AI-powered cybersecurity platform for threat intelligence, attack simulation, incident response, and security operations.
</p>

---

## Overview

SentinelX is a modern cybersecurity operations platform that brings together threat intelligence, attack simulation, security monitoring, incident management, and AI-assisted analysis into a unified command center.

Designed as a next-generation Security Operations Center (SOC), SentinelX enables users to visualize threats, analyze security events, investigate incidents, and understand attacker behavior through an interactive and intelligent interface.

---

## Key Capabilities

* Security Operations Center (SOC) Dashboard
* Threat Intelligence & CVE Analysis
* MITRE ATT&CK Mapping
* Red Team Attack Simulation
* Blue Team Monitoring & Alerts
* AI Security Copilot
* Incident Response Management
* Risk Analytics & Visualization
* Security Event Correlation
* Real-Time Threat Monitoring

---

## Technology Stack

| Layer      | Technologies                          |
| ---------- | ------------------------------------- |
| Frontend   | React, TypeScript, Vite, Tailwind CSS |
| Backend    | Node.js, Express, TypeScript          |
| Database   | SQLite, Drizzle ORM                   |
| AI Layer   | OpenRouter, Groq, OpenAI              |
| Deployment | Vercel, Render                        |
| Monitoring | Pino Logger                           |

---

## Architecture

```text
Frontend (React + Vite)
          │
          ▼
Backend API (Node.js)
          │
          ▼
SQLite Database
          │
          ▼
AI Providers
(OpenRouter / Groq )
```

---

## Local Setup

### Install Dependencies

```bash
pnpm install
```

### Start Backend

```bash
pnpm --filter @workspace/api-server run dev
```

### Start Frontend

```bash
pnpm --filter @workspace/sentinelx run dev
```

---

## Project Goals

* Simulate real-world cybersecurity operations
* Visualize attacker and defender activities
* Provide actionable threat intelligence
* Enhance security awareness through AI
* Deliver an enterprise-grade SOC experience

---

## Deployment

Frontend: Vercel

Backend: Render

Database: SQLite

---

## Author

Aakash M

SentinelX — Cyber Defense Reimagined.
