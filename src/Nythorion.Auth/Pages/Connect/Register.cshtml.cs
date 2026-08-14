using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Nythorion.Auth.Data;

namespace Nythorion.Auth.Pages.Connect;

public sealed class RegisterModel(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager) : PageModel
{
    [BindProperty]
    public InputModel Input { get; set; } = new();

    [BindProperty]
    public string? ReturnUrl { get; set; }

    public List<string> Errors { get; private set; } = [];

    public void OnGet(string? returnUrl)
    {
        ReturnUrl = returnUrl;
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Page();
        }

        var user = new AppUser { UserName = Input.Username, Email = $"{Input.Username}@nythorion.local" };
        var result = await userManager.CreateAsync(user, Input.Password);

        if (!result.Succeeded)
        {
            Errors = result.Errors.Select(e => e.Description).ToList();
            return Page();
        }

        await signInManager.SignInAsync(user, isPersistent: false);
        return LocalRedirect(ReturnUrl ?? "/");
    }

    public sealed class InputModel
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required, MinLength(8)]
        public string Password { get; set; } = string.Empty;

        [Required, Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
