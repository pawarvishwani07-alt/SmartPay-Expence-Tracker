const registerForm =
    document.getElementById("registerForm");


const nameInput =
    document.getElementById("name");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const incomeInput =
    document.getElementById("income");

const termsInput =
    document.getElementById("terms");


const nameError =
    document.getElementById("nameError");

const emailError =
    document.getElementById("emailError");

const passwordError =
    document.getElementById("passwordError");

const confirmPasswordError =
    document.getElementById("confirmPasswordError");

const incomeError =
    document.getElementById("incomeError");


const registerMessage =
    document.getElementById("registerMessage");


const togglePassword =
    document.getElementById("togglePassword");


const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");


togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "Hide";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "Show";

    }

});


toggleConfirmPassword.addEventListener(
    "click",
    function () {

        if (
            confirmPasswordInput.type === "password"
        ) {

            confirmPasswordInput.type = "text";

            toggleConfirmPassword.textContent =
                "Hide";

        } else {

            confirmPasswordInput.type =
                "password";

            toggleConfirmPassword.textContent =
                "Show";

        }

    }
);


registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // Clear old messages

        nameError.textContent = "";

        emailError.textContent = "";

        passwordError.textContent = "";

        confirmPasswordError.textContent = "";

        incomeError.textContent = "";

        registerMessage.textContent = "";


        // Get values

        const name =
            nameInput.value.trim();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;

        const income =
            Number(incomeInput.value);


        let valid = true;


        if (name === "") {

            nameError.textContent =
                "Please enter your name.";

            valid = false;

        } else if (name.length < 2) {

            nameError.textContent =
                "Please enter a valid name.";

            valid = false;

        }


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
                "Please create a password.";

            valid = false;

        } else if (password.length < 6) {

            passwordError.textContent =
                "Password must contain at least 6 characters.";

            valid = false;

        }


        if (confirmPassword === "") {

            confirmPasswordError.textContent =
                "Please confirm your password.";

            valid = false;

        } else if (
            password !== confirmPassword
        ) {

            confirmPasswordError.textContent =
                "Passwords do not match.";

            valid = false;

        }


        if (
            incomeInput.value === "" ||
            income < 0
        ) {

            incomeError.textContent =
                "Please enter your income or budget.";

            valid = false;

        }


        if (!termsInput.checked) {

            registerMessage.textContent =
                "Please agree to continue.";

            registerMessage.style.color =
                "#f87171";

            valid = false;

        }


        if (!valid) {

            return;

        }


        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, income })
            });
            const result = await response.json();

            if (!response.ok) {
                registerMessage.textContent = result.error || "Registration failed.";
                registerMessage.style.color = "#f87171";
                return;
            }
        } catch (error) {
            registerMessage.textContent = "Unable to connect to SmartPay.";
            registerMessage.style.color = "#f87171";
            return;
        }


        registerMessage.textContent =
            "Account created successfully. Please login.";

        registerMessage.style.color =
            "#86efac";


        setTimeout(function () {

            window.location.href =
                "login.html";

        }, 1200);

    }
);