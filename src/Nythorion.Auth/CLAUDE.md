# Nythorion.Auth — Guide

## Role
A standalone ASP.NET Core application that acts as the OAuth2/OIDC authorization server using OpenIddict.

## Key differences from IdentityServer4
- No static `Config.cs` — clients, scopes, and applications are stored in the database
- Clients are seeded on startup via `AuthSeeder` (an `IHostedService`)
- Three OpenIddict layers: Core (engine), Server (OIDC endpoints), Validation (token verification)
- Login UI will be Razor Pages (not a separate SPA)

## AuthDbContext
- Lives in `src/Nythorion.Auth/Data/AuthDbContext.cs`
- Owns the OpenIddict tables: Applications, Authorizations, Scopes, Tokens
- Database: `nythorion_auth` (separate from the main app database)

## Migrations
Run from the solution root:
```
dotnet dotnet-ef migrations add <Name> --project src/Nythorion.Auth
dotnet dotnet-ef database update --project src/Nythorion.Auth
```

## Adding new clients
- Always add new OAuth clients via `AuthSeeder`, never directly in the database
- Check if the client exists before creating — seeder runs on every startup
- Use `IOpenIddictApplicationManager` for all client management

## Token endpoint
- `/connect/token` — issues access tokens
- Currently supports client credentials flow (machine-to-machine)
- User login flow (authorization code + PKCE) will be added with the Angular UI

## Connection string
- Key: `ConnectionStrings:Default`
- Points to the `nythorion_auth` database
- Set in `appsettings.Development.json` (gitignored)
