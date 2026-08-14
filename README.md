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

This project runs its own Postgres **and** its own MongoDB — it does not share either with the original project, even if the original is also present on the same machine.

- `nythorion_node` — MongoDB, the app's data (documents, chunks, embeddings, flashcards, quizzes, notes)
- `nythorion_node_auth` — PostgreSQL, the Auth server's OpenIddict tables. Deliberately named differently from the original project's `nythorion_auth` so both projects could, in principle, run on the same machine without a database name collision.

Both are created by this project's own `docker/docker-compose.yml` — nothing needs to exist beforehand.

**Known limitation**: default ports (Auth server, Postgres, Mongo) are not currently changed to avoid collisions with the original .NET project. If you need both projects running at the same time, you'll need to adjust ports manually for now.

## Semantic search — phased approach

MongoDB's native vector search (`$vectorSearch`) is a public preview feature that requires a companion `mongot` process and a single-node replica set — more setup than the mature pgvector approach used in the original project.

- **Phase 1 (current)**: embeddings are stored as a plain array field on each chunk document. Semantic search computes cosine similarity in JavaScript over the candidate chunks. No `mongot`, no replica set required — just `mongod`.
- **Phase 2 (planned upgrade)**: once the app is fully working, add `mongot` + a single-node replica set and switch to a native `$vectorSearch` index for real vector search performance.

## Setup

### 1. Start the databases
```bash
cd docker
docker compose up -d
```
This creates both the Postgres container (`nythorion_node_auth`) and the MongoDB container (`nythorion_node`).

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
