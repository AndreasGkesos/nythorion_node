# Nythorion.Web — Guide

## Role
The Angular SPA frontend for Nythorion.

## Stack
- Angular (standalone components — no NgModules)
- Angular Material for UI components
- Signals for state management (avoid NgRx unless complexity clearly demands it)
- SCSS for styling

## Coding standards
- Standalone components only — never use NgModules
- Use signals (`signal`, `computed`, `effect`) for reactive state
- Use `inject()` function for dependency injection — not constructor injection
- Use `HttpClient` with typed responses
- Keep components focused — extract logic into services
- Use Angular Material components — do not build custom UI primitives

## Auth
- Communicates with `Nythorion.Auth` for login via authorization code flow + PKCE
- Stores tokens securely — never in localStorage, use memory + refresh token rotation
- Use Angular HTTP interceptors to attach Bearer tokens to API requests

## API communication
- All API calls go through a typed service layer
- Base URL configured via environment files (`environment.ts`)
- Handle errors at the service level, surface meaningful messages to components

## Folder structure (per feature)
```
src/app/
  features/
    documents/
      components/
      services/
      models/
  shared/
    components/
    services/
```
