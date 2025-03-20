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
