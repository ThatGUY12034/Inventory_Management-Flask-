let salesChart; // Store the Chart.js instance

// Function to fetch reports data from Flask API
function fetchReportsData() {
    fetch('/api/reports')
        .then(response => response.json())
        .then(data => {
            // Update report summary
            document.getElementById("totalRevenue").textContent = `₹${data.totalRevenue.toLocaleString()}`;
            document.getElementById("totalMembers").textContent = data.totalMembers;
            document.getElementById("totalOrders").textContent = data.totalOrders;

            // Update Sales Chart
            updateSalesChart(data.salesLabels, data.salesData);
        })
        .catch(error => console.error("Error fetching reports:", error));
}

// Function to update Sales Chart
function updateSalesChart(labels, salesData) {
    const ctx = document.getElementById("salesChart")?.getContext("2d");
    if (!ctx) return;

    if (salesChart) {
        // Update existing chart data
        salesChart.data.labels = labels;
        salesChart.data.datasets[0].data = salesData;
        salesChart.update();
    } else {
        // Create new chart instance
        salesChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Total Revenue (₹)",
                    data: salesData,
                    borderColor: "rgba(75, 192, 192, 1)",
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
    }
}

// Initialize reports data on page load
document.addEventListener("DOMContentLoaded", fetchReportsData);
