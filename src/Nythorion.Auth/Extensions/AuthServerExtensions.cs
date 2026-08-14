using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Nythorion.Auth.Data;

namespace Nythorion.Auth.Extensions;

public static class AuthServerExtensions
{
    public static IServiceCollection AddAuthServer(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AuthDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Default"));
            options.UseOpenIddict();
        });

        services.AddIdentity<AppUser, IdentityRole>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 8;
            })
            .AddEntityFrameworkStores<AuthDbContext>()
            .AddDefaultTokenProviders();

        services.ConfigureApplicationCookie(options =>
        {
            options.LoginPath = "/Connect/Login";
        });

        services.AddOpenIddict()
            .AddCore(options =>
            {
                options.UseEntityFrameworkCore()
                       .UseDbContext<AuthDbContext>();
            })
            .AddServer(options =>
            {
                options.SetAuthorizationEndpointUris("/connect/authorize")
                       .SetTokenEndpointUris("/connect/token");

                options.AllowClientCredentialsFlow();
                options.AllowAuthorizationCodeFlow().RequireProofKeyForCodeExchange();

                options.RegisterScopes(
                    OpenIddict.Abstractions.OpenIddictConstants.Scopes.OpenId,
                    OpenIddict.Abstractions.OpenIddictConstants.Scopes.Profile,
                    "api");

                options.AddDevelopmentEncryptionCertificate()
                       .AddDevelopmentSigningCertificate()
                       .DisableAccessTokenEncryption();

                options.UseAspNetCore()
                       .EnableTokenEndpointPassthrough()
                       .EnableAuthorizationEndpointPassthrough()
                       .EnableLogoutEndpointPassthrough();

                options.SetLogoutEndpointUris("/connect/logout");
            })
            .AddValidation(options =>
            {
                options.UseLocalServer();
                options.UseAspNetCore();
            });

        services.AddAuthentication(options =>
        {
            options.DefaultScheme = IdentityConstants.ApplicationScheme;
            options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
        });
        services.AddAuthorization();
        services.AddRazorPages();
        services.AddHostedService<AuthSeeder>();

        return services;
    }
}
