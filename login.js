const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

const loginMessage = document.getElementById("loginMessage");

const togglePassword =
    document.getElementById("togglePassword");


togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "Hide";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "Show";
    }

});


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    // Clear previous messages

    emailError.textContent = "";
    passwordError.textContent = "";
    loginMessage.textContent = "";


    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();


    let valid = true;


    if (email === "") {

        emailError.textContent =
            "Please enter your email.";

        valid = false;

    } else if (!email.includes("@")) {

        emailError.textContent =
            "Please enter a valid email.";

        valid = false;
    }


    if (password === "") {

        passwordError.textContent =
            "Please enter your password.";

        valid = false;

    } else if (password.length < 6) {

        passwordError.textContent =
            "Password must contain at least 6 characters.";

        valid = false;
    }


    if (!valid) {
        return;
    }


    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();

        if (!response.ok) {
            loginMessage.textContent = result.error || "Login failed.";
            loginMessage.style.color = "#f87171";
            return;
        }
    } catch (error) {
        loginMessage.textContent = "Unable to connect to SmartPay.";
        loginMessage.style.color = "#f87171";
        return;
    }

    loginMessage.textContent =
        "Login successful. Opening SmartPay Dashboard...";

    loginMessage.style.color = "#86efac";


    setTimeout(function () {

        window.location.href = "dashboard.html";

    }, 1000);

});