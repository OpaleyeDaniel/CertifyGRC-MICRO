# CertifyGRC

A full-stack compliance and audit management tool implementing **NIST Cybersecurity Framework (CSF) 2.0** workflows. Built with React, TypeScript, Express, and Vite.

---

## ✨ Features

- **NIST CSF 2.0 Assessment** — Structured maturity scoring across all CSF functions (Govern, Identify, Protect, Detect, Respond, Recover)
- **Gap Analysis** — Automatically detects and tracks control gaps from assessment results
- **Risk Assessment** — Multi-step risk description, likelihood/impact scoring, and treatment planning
- **Evidence Management** — Upload, review, and attest remediation evidence per control gap
- **Auditor Verification** — Comment, review, and approve remediation submissions
- **Continuous Improvement** — Track improvement actions and revision cycles
- **Risk Register** — Consolidated view of all completed risk assessments
- **Role-Based Access Control** — Admin, Auditor, and Implementer roles with granular page permissions
- **User Management** — Create and manage users with configurable permission templates
- **Multi-Theme Support** — Light, dark, and system theme preferences
- **Reporting** — Exportable compliance report page

---

## 🏗️ Tech Stack

| Layer      | Technology                                         |
|------------|----------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Routing    | React Router v6                                    |
| State      | React hooks + localStorage persistence             |
| Backend    | Node.js, Express 5                                 |
| Deployment | Netlify (frontend + serverless functions)          |
| Package Mgr| pnpm                                               |

---

## 📁 Project Structure

```
CertifyGRC/
├── client/                  # React frontend
│   ├── components/          # Feature components
│   │   ├── layout/          # Header, Sidebar, Layout wrapper
│   │   └── ui/              # shadcn/ui primitive components
│   ├── context/             # AuthContext, ThemeContext
│   ├── hooks/               # Custom hooks per workflow domain
│   ├── lib/                 # Types, utilities, data files
│   └── pages/               # Route-level page components
│       └── settings/        # Settings sub-pages
├── server/                  # Express backend
│   ├── routes/              # Route handlers (assessment, remediation, risk)
│   ├── index.ts             # Server factory (createServer)
│   └── node-build.ts        # Production entry point
├── shared/                  # Types/utilities shared by client & server
├── netlify/functions/       # Netlify serverless function wrapper
├── public/                  # Static assets (favicon, logo, robots.txt)
├── .env.example             # Environment variable template
├── netlify.toml             # Netlify deployment config
├── vite.config.ts           # Client build config
├── vite.config.server.ts    # Server build config
└── tsconfig.json            # TypeScript config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v22+
- **pnpm** v10+ (`npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/CertifyGRC.git
cd CertifyGRC

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your values
```

### Development

```bash
pnpm dev
```

Starts the Vite dev server at `http://localhost:8080` with the Express API served as middleware.

### Build

```bash
# Build both client and server
pnpm build

# Build client only (for Netlify)
pnpm build:client

# Build server only
pnpm build:server
```

### Run Production Server

```bash
pnpm start
```

Serves the built SPA and API from `dist/`.

### Tests

```bash
pnpm test
```

Runs Vitest unit tests.

### Type Checking

```bash
pnpm typecheck
```

---

## 🔐 Default Login

On first launch, a default admin account is seeded:

| Field    | Value                  |
|----------|------------------------|
| Email    | `admin@certifygrc.com` |
| Password | `Admin@123`            |

> **Important:** Change the default admin password immediately in a production environment.

---

## 🌐 Deployment

### Netlify (Recommended)

This project is pre-configured for Netlify deployment.

1. Push the repository to GitHub
2. Connect the repo in Netlify
3. Netlify will auto-detect `netlify.toml` settings:
   - **Build command:** `pnpm run build:client`
   - **Publish directory:** `dist/spa`
   - **Functions directory:** `netlify/functions`
4. Add environment variables in **Netlify → Site Settings → Environment Variables**

### Self-Hosted / Docker

Build the server bundle and serve it with Node:

```bash
pnpm build
pnpm start          # listens on PORT (default 3000)
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable                 | Required | Description                          |
|--------------------------|----------|--------------------------------------|
| `PORT`                   | No       | Server port (default: `3000`)        |
| `NODE_ENV`               | No       | `development` or `production`        |
| `PING_MESSAGE`           | No       | Response text for `/api/ping`        |
| `VITE_PUBLIC_BUILDER_KEY`| No       | Builder.io public key (CMS, if used) |

---

## 🧩 Role Permissions Matrix

| Page / Feature  | Admin | Auditor | Implementer |
|-----------------|-------|---------|-------------|
| Assessment      | ✅ edit | ❌ | ✅ edit |
| Gap Analysis    | ✅ edit | ❌ | ✅ edit |
| Risk Assessment | ✅ edit | 👁 view | 👁 view |
| Evidence        | ✅ edit | 👁 view | ✅ edit |
| Review          | ✅ edit | ✅ edit | 👁 view |
| Report          | ✅ edit | ❌ | 👁 view |
| Improvement     | ✅ edit | ❌ | ✅ edit |

---

## 📄 License

Private — All rights reserved. Not for public distribution.
