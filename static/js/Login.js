document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector(".login-form");

    // 🟢 Hide flash messages after 3 seconds (smooth fade-out)
    setTimeout(() => {
        document.querySelectorAll(".alert").forEach(alert => {
            alert.style.transition = "opacity 0.5s ease-out";
            alert.style.opacity = "0";
            setTimeout(() => alert.remove(), 500); // Remove after fading out
        });
    }, 3000);

    if (loginForm) {
        loginForm.setAttribute("autocomplete", "off"); // Prevent browser autofill

        loginForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent default form submission

            // Get values from form inputs
            const username = document.querySelector("input[name='username']").value.trim();
            const password = document.querySelector("input[name='password']").value.trim();

            // 🛑 Client-side validation
            if (!username || !password) {
                showAlert("Please fill in all fields.", "danger");
                return;
            }

            // 🔵 Send data to Flask backend via AJAX (Fetch API)
            fetch("/Login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username: username,
                    password: password,
                }),
            })
            .then(response => response.text())
            .then(data => {
                if (data.includes("Invalid username or password")) {
                    showAlert("Invalid username or password!", "danger");
                } else {
                    showAlert("Login successful! Redirecting...", "success");
                    setTimeout(() => window.location.href = "/Dashboard", 2000);
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
