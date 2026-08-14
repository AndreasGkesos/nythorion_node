using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Nythorion.Auth.Data;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;

namespace Nythorion.Auth.Endpoints;

public static class TokenEndpoint
{
    public static async Task<IResult> Handle(HttpContext context, UserManager<AppUser> userManager)
    {
        var transaction = context.Features.Get<OpenIddictServerAspNetCoreFeature>()?.Transaction;
        var request = transaction?.Request
            ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

        if (request.IsClientCredentialsGrantType())
        {
            var identity = new ClaimsIdentity(
                authenticationType: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                nameType: OpenIddictConstants.Claims.Name,
                roleType: OpenIddictConstants.Claims.Role);

            identity.AddClaim(OpenIddictConstants.Claims.Subject, request.ClientId!);

            var principal = new ClaimsPrincipal(identity);
            principal.SetScopes(request.GetScopes());
            principal.SetResources(AuthConstants.ApiResource);

            return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        if (request.IsAuthorizationCodeGrantType())
        {
            var result = await context.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            var userId = result.Principal?.GetClaim(OpenIddictConstants.Claims.Subject)
                ?? throw new InvalidOperationException("The user principal cannot be retrieved.");

            var user = await userManager.FindByIdAsync(userId)
                ?? throw new InvalidOperationException("The user cannot be found.");

            var identity = new ClaimsIdentity(
                authenticationType: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                nameType: OpenIddictConstants.Claims.Name,
                roleType: OpenIddictConstants.Claims.Role);

            identity.AddClaim(new Claim(OpenIddictConstants.Claims.Subject, await userManager.GetUserIdAsync(user))
                .SetDestinations(OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken));
            identity.AddClaim(new Claim(OpenIddictConstants.Claims.Name, user.UserName!)
                .SetDestinations(OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken));

            var principal = new ClaimsPrincipal(identity);
            principal.SetScopes(request.GetScopes());
            principal.SetResources(AuthConstants.ApiResource);

            return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        return Results.Problem("The specified grant type is not supported.");
    }
}
