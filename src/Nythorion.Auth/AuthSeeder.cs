using Microsoft.AspNetCore.Identity;
using Nythorion.Auth.Data;
using OpenIddict.Abstractions;

namespace Nythorion.Auth;

public sealed class AuthSeeder(IServiceProvider services, IConfiguration configuration) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;

        await SeedScopesAsync(sp, cancellationToken);
        await SeedClientsAsync(sp, cancellationToken);
        await SeedAdminUserAsync(sp, cancellationToken);
    }

    private static async Task SeedScopesAsync(IServiceProvider sp, CancellationToken ct)
    {
        var scopeManager = sp.GetRequiredService<IOpenIddictScopeManager>();
        if (await scopeManager.FindByNameAsync("api", ct) is null)
        {
            await scopeManager.CreateAsync(new OpenIddictScopeDescriptor
            {
                Name = "api",
                DisplayName = "Nythorion API",
                Resources = { AuthConstants.ApiResource }
            }, ct);
        }
    }

    private static async Task SeedClientsAsync(IServiceProvider sp, CancellationToken ct)
    {
        var manager = sp.GetRequiredService<IOpenIddictApplicationManager>();

        // Machine-to-machine client (kept for dev tooling)
        if (await manager.FindByClientIdAsync("nythorion-web", ct) is null)
        {
            await manager.CreateAsync(new OpenIddictApplicationDescriptor
            {
                ClientId = "nythorion-web",
                ClientSecret = "nythorion-web-secret",
                DisplayName = "Nythorion Web",
                Permissions =
                {
                    OpenIddictConstants.Permissions.Endpoints.Token,
                    OpenIddictConstants.Permissions.GrantTypes.ClientCredentials,
                    OpenIddictConstants.Permissions.Prefixes.Scope + "api"
                }
            }, ct);
        }

        // Browser client — Authorization Code + PKCE, no secret
        var spaDescriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = "nythorion-spa",
            ClientType = OpenIddictConstants.ClientTypes.Public,
            DisplayName = "Nythorion SPA",
            RedirectUris = { new Uri("http://localhost:4200/callback") },
            PostLogoutRedirectUris = { new Uri("http://localhost:4200") },
            Permissions =
            {
                OpenIddictConstants.Permissions.Endpoints.Authorization,
                OpenIddictConstants.Permissions.Endpoints.Token,
                OpenIddictConstants.Permissions.Endpoints.Logout,
                OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode,
                OpenIddictConstants.Permissions.ResponseTypes.Code,
                OpenIddictConstants.Permissions.Prefixes.Scope + "api",
                OpenIddictConstants.Permissions.Prefixes.Scope + "openid",
                OpenIddictConstants.Permissions.Prefixes.Scope + "profile",
            }
        };

        var spaClient = await manager.FindByClientIdAsync("nythorion-spa", ct);
        if (spaClient is null)
            await manager.CreateAsync(spaDescriptor, ct);
        else
            await manager.UpdateAsync(spaClient, spaDescriptor, ct);
    }

    private async Task SeedAdminUserAsync(IServiceProvider sp, CancellationToken ct)
    {
        var userManager = sp.GetRequiredService<UserManager<AppUser>>();

        var username = configuration["AdminUser:Username"];
        var password = configuration["AdminUser:Password"];

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("AdminUser:Username and AdminUser:Password must be set in configuration.");

        if (await userManager.FindByNameAsync(username) is null)
        {
            var user = new AppUser { UserName = username, Email = $"{username}@nythorion.local" };
            await userManager.CreateAsync(user, password);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
