document.addEventListener("DOMContentLoaded", function() {
    // Hide flash messages after 3 seconds
    setTimeout(function() {
        let alerts = document.querySelectorAll(".alert");
        alerts.forEach(alert => {
            alert.style.display = "none";
        });
    }, 3000);

    // Disable form auto-complete
    document.querySelector(".register-form").setAttribute("autocomplete", "off");
});
