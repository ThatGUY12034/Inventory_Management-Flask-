document.addEventListener("DOMContentLoaded", function () {
    // Toggle dropdown menu
    const dropdownIcon = document.querySelector(".dropdown-icon");
    const dropdownMenu = document.getElementById("dropdownMenu");

    if (dropdownIcon && dropdownMenu) {
        dropdownIcon.addEventListener("click", function (event) {
            event.stopPropagation(); // Prevent event from bubbling to the document
            dropdownMenu.classList.toggle("show");
        });

        // Close dropdown if clicked outside
        document.addEventListener("click", function (event) {
            if (!dropdownMenu.contains(event.target) && !dropdownIcon.contains(event.target)) {
                dropdownMenu.classList.remove("show");
            }
        });
    }


    // Global search functionality
    const searchInput = document.getElementById("globalSearch");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const query = searchInput.value.toLowerCase();
            const items = document.querySelectorAll(".card, .top-item, .item");

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? "flex" : "none";
            });
        });
    }
});


document.addEventListener("DOMContentLoaded", function () {
    // Fetch inventory items and display them in the Product Details section
    fetch("/get_inventory")
        .then(response => response.json())
        .then(data => {
            const productDetailsDiv = document.querySelector(".product-details");

            data.forEach(item => {
                const itemDiv = document.createElement("div");
                itemDiv.classList.add("item");
                itemDiv.innerHTML = `<span>${item.name}</span> <span>${item.stock}</span>`;
                productDetailsDiv.appendChild(itemDiv);
            });
        })
        .catch(error => console.error("Error fetching inventory:", error));
});

document.addEventListener("DOMContentLoaded", function () {
    fetch('/api/dashboard_summary')
        .then(response => response.json())
        .then(data => {
            document.getElementById("toBeProcessed").textContent = data.toBeProcessed || 0;
            document.getElementById("toBeShipped").textContent = data.toBeShipped || 0;
            document.getElementById("toBeDelivered").textContent = data.toBeDelivered || 0;
            document.getElementById("returned").textContent = data.returned || 0;
        })
        .catch(error => console.error("Error fetching dashboard data:", error));
});
let dashboardChart; // Store the Chart.js instance for Dashboard

// Function to fetch reports data from Flask API (same data used in reports)
function fetchDashboardData() {
    fetch('/api/reports')
        .then(response => response.json())
        .then(data => {
            // Update Dashboard Pie Chart
            updateDashboardPieChart(data.salesLabels, data.salesData);
        })
        .catch(error => console.error("Error fetching dashboard data:", error));
}

// Function to update Dashboard Pie Chart
function updateDashboardPieChart(labels, salesData) {
    const ctx = document.getElementById("dashboardPieChart")?.getContext("2d");
    if (!ctx) return;

    if (dashboardChart) {
        // Update existing chart data
        dashboardChart.data.labels = labels;
        dashboardChart.data.datasets[0].data = salesData;
        dashboardChart.update();
    } else {
        // Create new chart instance with a pie chart type for the dashboard
        dashboardChart = new Chart(ctx, {
            type: "pie",  // Set chart type to pie for dashboard
            data: {
                labels: labels,
                datasets: [{
                    label: "Total Revenue (₹)",
                    data: salesData,
                    backgroundColor: [
                        "rgba(75, 192, 192, 0.6)",
                        "rgba(153, 102, 255, 0.6)",
                        "rgba(255, 159, 64, 0.6)",
                        "rgba(255, 99, 132, 0.6)"
                    ],  // Colors for pie slices
                    borderColor: "rgba(255, 255, 255, 1)",  // Border color for pie slices
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,  // Make the chart responsive
            }
        });
    }
}

// Initialize dashboard data on page load
document.addEventListener("DOMContentLoaded", fetchDashboardData);
