using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Nythorion.Auth.Data;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;

namespace Nythorion.Auth.Endpoints;

public static class AuthorizeEndpoint
{
    public static async Task<IResult> Handle(HttpContext context, UserManager<AppUser> userManager)
    {
        var transaction = context.Features.Get<OpenIddictServerAspNetCoreFeature>()?.Transaction;
        var request = transaction?.Request
            ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

        var result = await context.AuthenticateAsync(IdentityConstants.ApplicationScheme);
        if (!result.Succeeded)
        {
            return Results.Challenge(
                new AuthenticationProperties { RedirectUri = context.Request.PathBase + context.Request.Path + QueryString.Create(context.Request.Query.ToList()) },
                [IdentityConstants.ApplicationScheme]);
        }

        var user = await userManager.GetUserAsync(result.Principal)
            ?? throw new InvalidOperationException("The user details cannot be retrieved.");

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
}
