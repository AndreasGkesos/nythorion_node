using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Nythorion.Auth.Data;

namespace Nythorion.Auth.Pages.Connect;

public sealed class LoginModel(SignInManager<AppUser> signInManager) : PageModel
{
    [BindProperty]
    public InputModel Input { get; set; } = new();

    [BindProperty]
    public string? ReturnUrl { get; set; }

    public string? ErrorMessage { get; private set; }

    public void OnGet(string? returnUrl)
    {
        ReturnUrl = returnUrl;
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
            return Page();

        var result = await signInManager.PasswordSignInAsync(
            Input.Username, Input.Password, isPersistent: false, lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            ErrorMessage = result.IsLockedOut ? "Account locked. Try again later." : "Invalid username or password.";
            return Page();
        }

        return LocalRedirect(ReturnUrl ?? "/");
    }

    public sealed class InputModel
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
