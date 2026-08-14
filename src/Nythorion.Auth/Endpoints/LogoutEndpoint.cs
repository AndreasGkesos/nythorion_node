using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenIddict.Server.AspNetCore;

namespace Nythorion.Auth.Endpoints;

public static class LogoutEndpoint
{
    public static async Task<IResult> Handle(HttpContext context, SignInManager<Data.AppUser> signInManager)
    {
        await signInManager.SignOutAsync();
        return Results.SignOut(
            authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
            properties: new AuthenticationProperties { RedirectUri = "/" });
    }
}
