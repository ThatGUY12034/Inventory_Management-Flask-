document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.querySelector(".register-form");

    // 🟢 Hide flash messages after 3 seconds (smooth fade-out)
    setTimeout(() => {
        document.querySelectorAll(".alert").forEach(alert => {
            alert.style.transition = "opacity 0.5s ease-out";
            alert.style.opacity = "0";
            setTimeout(() => alert.remove(), 500); // Remove after fading out
        });
    }, 3000);

    if (registerForm) {
        registerForm.setAttribute("autocomplete", "off"); // Prevent browser autofill

        registerForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent default form submission

            const username = document.querySelector("input[name='username']").value.trim();
            const email = document.querySelector("input[name='email']").value.trim();
            const password = document.querySelector("input[name='password']").value.trim();
            const confirmPassword = document.querySelector("input[name='confirm_password']").value.trim();

            // 🛑 Client-side validation
            if (!username || !email || !password || !confirmPassword) {
                showAlert("All fields are required!", "danger");
                return;
            }

            if (password !== confirmPassword) {
                showAlert("Passwords do not match!", "danger");
                return;
            }

            // 🔵 Send data to Flask backend via AJAX (Fetch API)
            fetch("/Register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username: username,
                    email: email,
                    password: password,
                    confirm_password: confirmPassword
                }),
            })
            .then(response => response.text())
            .then(data => {
                if (data.includes("Email already registered!")) {
                    showAlert("Email already registered!", "warning");
                } else if (data.includes("Passwords do not match")) {
                    showAlert("Passwords do not match!", "danger");
                } else {
                    showAlert("Registration successful! Redirecting...", "success");
                    setTimeout(() => window.location.href = "/Login", 2000);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                showAlert("Something went wrong. Please try again!", "danger");
            });
        });
    }
});

// 🟢 Function to display alerts dynamically
function showAlert(message, type) {
    const alertBox = document.createElement("div");
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    document.body.prepend(alertBox);

    setTimeout(() => {
        alertBox.style.transition = "opacity 0.5s ease-out";
        alertBox.style.opacity = "0";
        setTimeout(() => alertBox.remove(), 500);
    }, 3000);
}
