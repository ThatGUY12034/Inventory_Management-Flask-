document.addEventListener("DOMContentLoaded", function () {
    fetchSalesData();
});

function fetchSalesData() {
    fetch("/get_orders")
        .then(response => response.json())
        .then(orders => {
            let totalRevenue = 0;
            let processedOrders = 0;
            let canceledOrders = 0;
            let activeCustomers = new Set();

            // Process order data
            orders.forEach(order => {
                let amount = parseFloat(order.orderAmount) || 0;
                totalRevenue += amount;

                if (order.orderStatus === "Delivered" || order.orderStatus === "Shipped") {
                    processedOrders++;
                } else if (order.orderStatus === "Cancelled") {
                    canceledOrders++;
                }

                activeCustomers.add(order.customerName);
            });

            // Update Sales Statistics
            document.getElementById("totalRevenue").textContent = `₹${totalRevenue.toFixed(2)}`;
            document.getElementById("processedOrders").textContent = processedOrders;
            document.getElementById("canceledOrders").textContent = canceledOrders;
            document.getElementById("activeCustomers").textContent = activeCustomers.size;

            // Update Recent Sales Orders Table
            let recentOrdersContainer = document.getElementById("recentOrders");
            recentOrdersContainer.innerHTML = "";
            orders.slice(-5).reverse().forEach(order => {
                recentOrdersContainer.innerHTML += `
                    <tr>
                        <td class="p-2 border">#${order.orderId}</td>
                        <td class="p-2 border">${order.customerName}</td>
                        <td class="p-2 border">₹${order.orderAmount}</td>
                        <td class="p-2 border ${getStatusClass(order.orderStatus)}">${order.orderStatus}</td>
                    </tr>
                `;
            });
        })
        .catch(error => console.error("Error fetching sales data:", error));
}

// Helper function to assign color classes based on order status
function getStatusClass(status) {
    if (status === "Delivered" || status === "Shipped") return "text-green-500";
    if (status === "Pending") return "text-yellow-500";
    if (status === "Cancelled") return "text-red-500";
    return "";
}
