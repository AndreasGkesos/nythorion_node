# Nythorion Node

## Overview

Nythorion Node is a local AI-powered knowledge and learning platform. Upload PDF or DOCX documents, then query them with natural language, generate summaries, and get auto-generated flashcards and quizzes — all processing happens locally, no paid cloud APIs or external data transmission.

This is a Node.js + MongoDB rebuild of the original [Nythorion](https://github.com/AndreasGkesos/nythorion) (.NET 9 + Angular + PostgreSQL/pgvector), built as a learning project focused specifically on Node.js and MongoDB.

## Features

- **Document upload** — PDF/DOCX, parsed, chunked, and embedded in the background
- **Semantic search** — vector similarity search across your documents
- **RAG Q&A and chat** — ask questions grounded in your documents, with source citations; multi-turn chat with query rewriting
- **Summaries** — map-reduce summarization of each document
- **Flashcards & quizzes** — auto-generated after upload, or generate more on demand
- **Notes** — free-text notes per document

## Key Technologies

- **Node.js + Fastify** (backend API)
- **Angular** (frontend, reused from the original project)
- **MongoDB** (application data, brute-force cosine similarity search — see [Semantic search](#semantic-search--phased-approach))
- **PostgreSQL** (Auth server's OpenIddict tables)
- **Ollama** (local LLM runtime — `qwen2.5:7b-instruct-q4_K_M` for generation, `nomic-embed-text` for embeddings)
- **OpenIddict** (authentication, reused from the original project)

## Why parts of this repo are "copied," not built from scratch

Two folders in `src/` — `Nythorion.Auth` and `Nythorion.Web` — are carried over from the original .NET project rather than rebuilt here. That's a deliberate choice, not an oversight: the learning goal of this project is the backend and database layer, not re-solving auth or rebuilding the UI. Both already work in the original project, so they're reused as-is.

**Important**: this project has no live connection to the original repo. It doesn't read from it, reference it, or depend on it being present on disk anywhere. The Auth and Web code was copied once, and from that point on this is a fully independent project that happens to contain code that originated elsewhere.

Reused code is not the same as configured code — see setup below.

## Architecture

| Layer | Original (.NET) | This project |
|---|---|---|
| Backend API | .NET 9 / ASP.NET Core | **Node.js + Fastify** |
| Database | PostgreSQL + pgvector | **MongoDB** |
| Auth server | OpenIddict | OpenIddict (reused, unchanged) |
| Frontend | Angular | Angular (reused, unchanged) |
| LLM / embeddings | Ollama | Ollama (unchanged) |

## Databases

This project runs its own Postgres **and** its own MongoDB, both installed **natively** on Windows (no Docker) — it does not share either with the original project, even if the original is also present on the same machine.

- `nythorion_node` — MongoDB, the app's data (documents, chunks, embeddings, flashcards, quizzes, notes)
- `nythorion_node_auth` — PostgreSQL, the Auth server's OpenIddict tables. Deliberately named differently from the original project's `nythorion_auth` so both projects could, in principle, run against the same local Postgres instance without a database name collision.

**Why native instead of Docker**: this project originally used Docker Compose for both databases, but Docker Desktop's image-pull path proved unreliable on this machine (containerd snapshotter dropping connections mid-download). Native installs sidestep that entirely and keep setup simple.

**Known limitation**: default ports (Auth server, Postgres, Mongo) are not currently changed to avoid collisions with the original .NET project. If you need both projects running at the same time, you'll need to adjust ports manually for now.

## Semantic search — phased approach

MongoDB's native vector search (`$vectorSearch`) is a public preview feature that requires a companion `mongot` process and a single-node replica set — more setup than the mature pgvector approach used in the original project, and more involved without Docker to isolate the extra process.

- **Phase 1 (current)**: embeddings are stored as a plain array field on each chunk document. Semantic search computes cosine similarity in JavaScript over the candidate chunks. No `mongot`, no replica set required — just `mongod`.
- **Phase 2 (planned upgrade)**: once the app is fully working, add `mongot` + a single-node replica set and switch to a native `$vectorSearch` index for real vector search performance.

## Prerequisites

Download and install each of these before starting:

| Tool | Version |
|------|---------|
| .NET SDK | 9.0 |
| Node.js | 20+ |
| PostgreSQL | 16.x |
| MongoDB Community Server | 8.2+ |
| Ollama | latest |

> **GPU note:** A dedicated GPU with 6GB+ VRAM is recommended for acceptable response times. Ollama can run on CPU only, but generation will be slow.

---

## First-time setup

### 1. Trust the HTTPS development certificate

Run this once per machine after installing the .NET SDK:

```bash
dotnet dev-certs https --trust
```

When prompted, click **Yes** to trust the certificate.

This makes the browser and .NET itself trust `Nythorion.Auth`'s local HTTPS cert, but **Node.js does not read the Windows trust store** — `Nythorion.Api` needs its own copy of the cert to validate JWTs against Auth's JWKS endpoint. Export one:

```bash
dotnet dev-certs https --export-path src/Nythorion.Api/certs/aspnet-dev-cert.pem --format PEM --no-password
```

This is machine-specific (gitignored) — anyone running this project needs to run this export themselves, once.

### 2. Install PostgreSQL and MongoDB natively

Unlike the original project, this one does **not** use Docker — Docker Desktop's image-pull path proved unreliable on the original dev machine, so both databases run as plain native Windows services instead.

- **PostgreSQL**: installer from https://www.postgresql.org/download/windows/. Set a superuser password during install, keep the default port `5432`.
- **MongoDB Community Server**: installer from https://www.mongodb.com/try/download/community. Choose "Complete" setup, keep "Install MongoDB as a Service" checked, default port `27017`.

After installing, create the `nythorion_node_auth` database in Postgres (via `psql` or pgAdmin):

```sql
CREATE DATABASE nythorion_node_auth;
```

MongoDB's `nythorion_node` database is created automatically on first write — no manual step needed.

### 3. Pull Ollama models

Make sure Ollama is running (it should appear in your system tray after installation), then pull the two models the app uses:

```bash
ollama pull qwen2.5:7b-instruct-q4_K_M
ollama pull nomic-embed-text
```

The first model (~4.7GB) handles text generation. The second handles search embeddings. This only needs to be done once.

### 4. Configure Nythorion.Auth

Copy the example config file:

- **bash:** `cp src/Nythorion.Auth/appsettings.Development.json.example src/Nythorion.Auth/appsettings.Development.json`
- **PowerShell:** `copy src/Nythorion.Auth/appsettings.Development.json.example src/Nythorion.Auth/appsettings.Development.json`

Then open the file, point the connection string at `nythorion_node_auth` with your own Postgres superuser credentials, and set a password for the admin account you'll log in with:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=nythorion_node_auth;Username=postgres;Password=your-postgres-password"
  },
  "AdminUser": {
    "Username": "admin",
    "Password": "your-password-here"
  }
}
```

Do not reuse secrets from the original project — generate fresh local values.

### 5. Run Auth database migrations

```bash
dotnet ef database update --project src/Nythorion.Auth
```

You only need to run this once, and again after pulling updates that include new migrations.

### 6. Configure Nythorion.Api

```bash
cd src/Nythorion.Api
npm install
```

Create a `.env` file (see `.env.example` at the repo root) with your Mongo URI, Auth server URL, and Ollama settings.

### 7. Configure Nythorion.Web

- Update `src/Nythorion.Web/src/environments/environment.ts`'s `apiUrl` to point at `Nythorion.Api` (`http://localhost:3000`) instead of the original .NET API
- `npm install` from `src/Nythorion.Web`

---

## Running

You need three things running at the same time. Open three separate terminals from the repo root:

```bash
# Terminal 1 — Auth server (must use the https profile to bind to port 7087)
dotnet run --project src/Nythorion.Auth --launch-profile https

# Terminal 2 — API
cd src/Nythorion.Api
npm start

# Terminal 3 — Frontend
cd src/Nythorion.Web
npm start
```

Then open `http://localhost:4200` and log in with the admin credentials you set in step 4.

> **Ollama must be running** before you start the backend.

## Ollama Configuration

Default settings live in `src/Nythorion.Api/.env`:

- **OLLAMA_TEMPERATURE** — 0.1 by default (factual/deterministic; raise for more creative output)
- **OLLAMA_NUM_PREDICT** — max output tokens, default 4096
- **OLLAMA_BASE_URL** — Ollama service endpoint, default `http://localhost:11434`
- **OLLAMA_LLM_MODEL** — `qwen2.5:7b-instruct-q4_K_M`
- **OLLAMA_EMBED_MODEL** — `nomic-embed-text`

## Status

Core feature set is built and working end to end: upload/parse/chunk/embed, semantic search, RAG Q&A and chat, and auto-generated summaries/flashcards/quizzes on upload, plus notes. Still needs broader end-to-end testing across a wider variety of documents (different formats, lengths, and content types) to shake out edge cases. See `CLAUDE.md` for the full technical guide, coding philosophy, and build order.

## License

MIT
