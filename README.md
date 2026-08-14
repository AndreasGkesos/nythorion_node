# Nythorion Node

A local AI-powered knowledge and learning platform — upload PDF/DOCX documents, get semantic search, RAG Q&A with citations, summaries, flashcards, quiz questions, and per-document notes. Runs entirely on your machine, no paid cloud APIs.

This is a Node.js + MongoDB rebuild of the original [Nythorion](#) (.NET 9 + Angular + PostgreSQL/pgvector), built as a learning project focused specifically on Node.js and MongoDB.

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

## Setup

### 1. Install the databases natively
- **PostgreSQL**: download and run the installer from https://www.postgresql.org/download/windows/ (PostgreSQL 16.x, Windows x86-64). Set a superuser password during install, keep the default port `5432`.
- **MongoDB Community Server**: download and run the installer from https://www.mongodb.com/try/download/community (current stable, Windows x64, msi package). Choose "Complete" setup, keep "Install MongoDB as a Service" checked, default port `27017`.

After installing, create the `nythorion_node_auth` database in Postgres (via `psql` or pgAdmin):
```sql
CREATE DATABASE nythorion_node_auth;
```
MongoDB's `nythorion_node` database is created automatically on first write — no manual step needed.

### 2. Configure and run Nythorion.Auth
- Copy `appsettings.Development.json.example` → `appsettings.Development.json`
- Set the connection string to point at `nythorion_node_auth`, not the original project's database
- Do not reuse secrets from the original project — generate fresh local values
- `dotnet run` from `src/Nythorion.Auth`

### 3. Configure and run Nythorion.Web
- Update the API base URL to point at this project's Node backend (see `Nythorion.Api` below), not the original .NET API
- `npm install && npm start` from `src/Nythorion.Web`

### 4. Build and run Nythorion.Api (Node backend)
This is the part being actively built. See `CLAUDE.md` for architecture, coding standards, and the feature specification this backend needs to replicate.

### 5. Ollama
Make sure Ollama is running locally with `qwen2.5:7b` and `nomic-embed-text` pulled — same models as the original project, no change needed here.

## Status

This project is under active development. See `CLAUDE.md` for the full technical guide, coding philosophy, and build order.
