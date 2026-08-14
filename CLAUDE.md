# Nythorion Node — Project Guide

## What this is
A local AI-powered knowledge and learning platform. Runs entirely on the user's machine — no paid cloud APIs. Supports PDF/DOCX upload, semantic search, RAG Q&A (answers grounded in the user's documents, with source citations), summaries, flashcards, quiz questions, and per-document notes.

This is a rebuild of the original Nythorion (.NET 9 + Angular + PostgreSQL/pgvector, finished, public repo) using Node.js and MongoDB, as a learning exercise focused on Node and Mongo specifically. This project lives in its own folder with no connection to the original .NET repo — nothing here reads from it, references it, or depends on it being present on the machine.

The `Nythorion.Auth` and `Nythorion.Web` folders were copied over from the original project because that code already works and isn't the point of this exercise — the learning focus is the backend and database. But copying the code is not the same as it being set up. Both need fresh configuration in this project before they'll run: new connection strings, new secrets, new database name, and Angular's API base URL pointed at the new Node backend instead of the old .NET one. See "Reused code — setup required" below.

## Philosophy — read this before writing code
- Priority is **it runs and does the same thing as the original**, not best practice or performance. This means: skip robustness/performance work that isn't needed yet — retry logic, caching, connection pooling, exhaustive edge-case handling, the fastest possible algorithm (e.g. cosine similarity in JS instead of a proper vector index is fine to start). It does **not** mean write sloppy or careless code. Basic hygiene still applies: clear naming, functions that do one thing, no dead code, reasonably organized folders. The target is "simple and working," not "optimal and slow to build" — and also not "messy and hard to follow later."
- Do **not** port the old .NET architecture (VSA, MediatR, modular monolith) into Node. Write idiomatic Node instead — plain feature-folder REST routes with async handlers.
- Simple and working beats clean and slow-to-build. Where something isn't strictly necessary (e.g. a job queue), default to the simplest local option unless told otherwise.
- Build one vertical slice end to end before moving to the next feature. Don't try to stand up the whole backend at once. Suggested order: (1) upload → parse → chunk → embed → store, (2) semantic search, (3) RAG Q&A, (4) summaries, (5) flashcards / quiz / notes.
- Default to the simplest local option unless there's a reason not to — e.g. background document processing should be a plain in-process queue (array/EventEmitter), not a Redis-backed queue like BullMQ, unless a real need for durability comes up later.

## Architecture
- **Backend**: Node.js + Fastify. Feature-folder routes, no forced layering.
- **Auth server**: OpenIddict (unchanged from the original project, separate ASP.NET Core process). Node backend validates JWTs against it — no auth logic lives in Node.
- **Frontend**: Angular SPA (unchanged from the original project, carried over as-is). API service URLs/contracts will be adjusted as needed if endpoint shapes differ from the original .NET API.

## Solution structure
```
src/
  Nythorion.Auth/         # OpenIddict auth server, unchanged, separate ASP.NET Core app
  Nythorion.Web/          # Angular SPA, unchanged
  Nythorion.Api/          # NEW — Node.js/Fastify backend (to be built)
docker/
  docker-compose.yml      # PostgreSQL (for Auth, unchanged) + MongoDB (mongod + mongot for the app)
```

## Technology stack
- Node.js (Fastify)
- MongoDB Community Edition 8.2+ (native vector search — requires `mongod` + `mongot` containers, single-node replica set)
- Mongoose
- Ollama (runs on host, not in Docker) — qwen2.5:7b for LLM, nomic-embed-text for embeddings, called via the `ollama` npm package
- OpenIddict for auth (unchanged)
- Angular (unchanged)

## Database and semantic search — phased approach

Two databases, on two different engines — this is a change from the original project, not a straight carry-over. This project is fully self-contained: it does not depend on the original .NET project's containers, databases, or repo being present on the machine at all. Everything needed is created fresh by this project's own Docker Compose setup.

- **`nythorion_node`** — the app's **MongoDB** database (documents, chunks, embeddings, flashcards, quizzes, notes). This is the one being rebuilt.
- **`nythorion_node_auth`** — the Auth server's database, **PostgreSQL**, functionally identical to the original project's `nythorion_auth` (same OpenIddict tables via EF Core) but created under a different name in this project's own Postgres container. The different name is intentional — it avoids a collision if someone ever runs both the original .NET project and this Node project on the same machine at the same time.

Docker Compose in this project must create **both** databases from scratch on first run:
- A Postgres container/service, initializing the `nythorion_node_auth` database (adapt the original project's `init-db.sql` pattern, renamed)
- A MongoDB container/service (`mongod`, plus `mongot` once Phase 2 vector search is added) for `nythorion_node`

**Known limitation, not yet solved**: if both the original .NET project and this Node project are run at the same time, other ports (Auth server, Postgres, etc.) will still collide by default since both projects use the same defaults. Out of scope for now — note it here so it isn't a surprise later, and revisit if running both simultaneously actually becomes a need.

MongoDB's native vector search (`$vectorSearch`) requires a companion `mongot` process alongside `mongod`, plus a single-node replica set — it is a **public preview feature**, newer and less battle-tested than the pgvector setup from the original project. Setup is fiddly (replica set init, `mongot` user/sync-source config) and worth expecting friction on.

Given that, and given the project's "make it run first" priority, semantic search should be built in two phases:

**Phase 1 — initial/working solution (build this first):**
- Store each chunk's embedding as a plain array field directly on the chunk document (embedded in the same collection as the chunk itself, not a separate vector index)
- Semantic search = pull the candidate chunks (e.g. scoped to the user's documents), compute cosine similarity in JS against the query embedding, sort, return top-K
- No `mongot`, no replica set, no vector index required — just `mongod` on its own
- Slower and doesn't scale, but gets the RAG/search feature working end to end without fighting infrastructure first

**Phase 2 — nice-to-have once the project is otherwise running:**
- Stand up `mongot` alongside `mongod`, initialize the single-node replica set, configure the search user/sync source
- Create a proper `$vectorSearch` index on the chunks collection
- Swap the JS cosine-similarity search for a native `$vectorSearch` aggregation query
- Treat this as a later upgrade/learning step, not a blocker for getting the app working

## Coding standards
- Idiomatic Node/JS conventions — no forced translation of C# patterns
- Feature-folder structure: each feature (documents, search, learning, etc.) gets its own folder with routes + handler logic
- Async/await throughout
- Validate at API boundaries (Fastify schema validation or `zod`), trust internal code
- No over-engineering — build what the feature needs, nothing more
- Prefer simple, direct Mongoose schemas over abstraction layers

## Git rules
- Commit after each logical step
- Never push real secrets or `.env` files — gitignored
- `.env.example` is pushed as a template
- Keep commit messages clear and descriptive

## Secrets
- `.env` — gitignored, contains real local values (Mongo connection string, OpenIddict client config, etc.)
- `.env.example` — pushed, contains placeholder values
- Never hardcode secrets in any file that gets committed

## Reference to the original project
This project does not read from, fetch from, or otherwise depend on the original Nythorion .NET repository. It is a separate folder with no live connection. Domain rules that would normally come from reading the old code (chunking strategy, summarization batching, flashcard/quiz JSON shapes, user-isolation rules) are instead specified directly in this document and in the project brief given at the start of work — see "Feature specification" below. Don't assume access to, or try to locate, the original repo.

## Reused code — setup required
`Nythorion.Auth` and `Nythorion.Web` are copied from the original project as working, proven code — reused to keep the learning focus on Node/Mongo rather than rebuilding auth or the UI. Copied code is not configured code. Before either will run in this project, they need:

**Nythorion.Auth**
- New connection string pointing at this project's own Postgres container/database, `nythorion_node_auth` (not the original `nythorion_auth`)
- Fresh local secrets/`appsettings.Development.json` — do not reuse or copy secrets from the original project
- Confirm which port it runs on, and note that port in this project's own docs/`.env.example` (do not assume the original project's port assignment is documented anywhere accessible from here)

**Nythorion.Web**
- API base URL updated to point at the new Node backend (`Nythorion.Api`) instead of the original .NET API
- Any other environment/config values that referenced the old backend's shape should be reviewed, not assumed correct

## Feature specification
This is the full feature set this project needs to replicate, functionally — not 1:1 in implementation, but equivalent in behavior:

- **Document upload**: PDF or DOCX. Parse → chunk → generate embeddings → store.
- **Semantic search**: vector similarity search across a user's documents.
- **RAG Q&A**: answer questions grounded in the user's documents, with source citations back to the originating chunk/document.
- **Summaries**: map-reduce approach — summarize chunks in batches, then reduce the batch summaries into one final summary.
- **Flashcards**: Q&A pairs generated from chunks, structured JSON output.
- **Quiz questions**: multiple choice, 1 correct answer + 3 wrong answers, structured JSON output.
- **Notes**: free-text notes per document.
- **User isolation**: all documents, chunks, notes, flashcards, and quizzes are scoped to the owning user; no cross-user data access.
- **Auth flow**: Authorization Code + PKCE via OpenIddict (unchanged). Angular stores the token and injects it as a Bearer header; the Node API validates the JWT against the Auth server's JWKS endpoint.

If a specific detail isn't covered above (e.g. exact chunk size, exact prompt wording), make a reasonable choice and note the assumption — don't block on it.
