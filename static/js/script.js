document.addEventListener("DOMContentLoaded", function () {
    console.log("JavaScript Loaded!");

    // Sidebar Toggle Function
    const sidebar = document.querySelector(".bg-black");
    const links = document.querySelectorAll("nav a");

    links.forEach((link) => {
        link.addEventListener("mouseenter", () => {
            sidebar.style.width = "250px";
        });
        link.addEventListener("mouseleave", () => {
            sidebar.style.width = "64px";
        });
    });

    // Search Functionality
    const searchInput = document.querySelector("input[type='text']");
    searchInput.addEventListener("input", function () {
        let filter = searchInput.value.toLowerCase();
        let cards = document.querySelectorAll(".bg-white");

        cards.forEach((card) => {
            let text = card.innerText.toLowerCase();
            card.style.display = text.includes(filter) ? "" : "none";
        });
    });

    // Clickable Icons (For Future Enhancements)
    document.querySelectorAll("i").forEach((icon) => {
        icon.addEventListener("click", function () {
            alert("This feature is not yet implemented!");
        });
    });
});

function toggleDropdown() {
    var dropdown = document.getElementById("dropdownMenu");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

// Close the dropdown when clicking outside of it
document.addEventListener("click", function(event) {
    var dropdown = document.getElementById("dropdownMenu");
    var image = document.querySelector(".dropdown img");
    if (!dropdown.contains(event.target) && !image.contains(event.target)) {
        dropdown.style.display = "none";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById('salesChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Sales ($)',
                data: [3000, 3500, 4000, 4500, 4200, 5000, 5500],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
});
