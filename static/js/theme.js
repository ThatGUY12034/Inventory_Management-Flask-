document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("themeToggle");

    // Fetch the saved theme from Flask session
    fetch("/get_theme")
        .then(response => response.json())
        .then(data => {
            const savedTheme = data.theme || "light";
            document.body.classList.toggle("dark-theme", savedTheme === "dark");
            themeToggle.classList.toggle("fa-sun", savedTheme === "dark");
            themeToggle.classList.toggle("fa-moon", savedTheme !== "dark");
        });

    // Click Event - Toggle Theme
    themeToggle.addEventListener("click", function () {
        const isDark = document.body.classList.toggle("dark-theme");

        themeToggle.classList.toggle("fa-moon", !isDark);
        themeToggle.classList.toggle("fa-sun", isDark);

        const newTheme = isDark ? "dark" : "light";

        // Save the new theme in Flask session
        fetch("/set_theme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: newTheme })
        });
    });
});
