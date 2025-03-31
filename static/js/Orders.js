document.addEventListener("DOMContentLoaded", function () {
    loadOrders(); // Regular orders table
    loadRecentOrders(); // Fetch and display the 5 most recent orders in the dashboard

    const form = document.getElementById("addOrderForm");
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            addOrder();
        });
    }

    const modal = document.getElementById("orderModal");
    const addOrderBtn = document.getElementById("addOrderBtn");
    const closeModalBtn = document.getElementById("closeModal");
    const cancelModalBtn = document.getElementById("cancelModal");

    function toggleOrderModal(show) {
        if (!modal) return;
        modal.classList.toggle("show", show);
        modal.style.display = show ? "block" : "none";
    }

    addOrderBtn.addEventListener("click", function () {
        document.getElementById("addOrderForm").reset();
        toggleOrderModal(true);
    });

    closeModalBtn.addEventListener("click", () => toggleOrderModal(false));
    cancelModalBtn.addEventListener("click", () => toggleOrderModal(false));

    window.addEventListener("click", function (event) {
        if (event.target === modal) toggleOrderModal(false);
    });
});


// Fetch and display the 5 most recent orders in the dashboard
// Fetch and display the 5 most recent orders in the dashboard table
function loadRecentOrders() {
    fetch('/api/recent_orders')
        .then(response => response.json())
        .then(orders => {
            let recentOrdersBody = document.getElementById("recentOrdersBody");
            recentOrdersBody.innerHTML = "";  // Clear previous content

            // Loop through the orders and display them dynamically in table rows
            orders.forEach(order => {
                const row = document.createElement("tr");

                // Format the date and amount properly
                const orderDate = new Date(order.orderDate).toLocaleDateString();  // Format date
                const orderAmount = `₹${parseFloat(order.orderAmount || 0).toLocaleString()}`;  // Format amount

                row.innerHTML = `
                    <td>${order.orderId}</td>
                    <td>${order.customerName}</td>
                    <td>${orderDate}</td>
                    <td>${orderAmount}</td>
                    <td>${order.orderStatus}</td>
                `;

                recentOrdersBody.appendChild(row);
            });
        })
        .catch(error => console.error("Error loading recent orders:", error));
}

// Call the function on page load to display the recent orders
document.addEventListener("DOMContentLoaded", function () {
    loadRecentOrders();  // Fetch and display the 5 most recent orders
});
// Add a new order
function addOrder() {
    let orderId = document.getElementById("orderId").value.trim();
    let customerName = document.getElementById("customerName").value.trim();
    let orderDate = document.getElementById("orderDate").value;
    let orderAmount = document.getElementById("orderAmount").value.trim();
    let orderStatus = document.getElementById("orderStatus").value;

    if (!orderId || !customerName || !orderDate || !orderAmount) {
        alert("Please fill in all fields.");
        return;
    }

    let orderData = { orderId, customerName, orderDate, orderAmount, orderStatus };

    fetch("/add_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Order added successfully!");
            addOrderToTable(orderData);
            updateOrderCounts();
            document.getElementById("addOrderForm").reset();
            setTimeout(() => toggleOrderModal(false), 300);
        } else {
            alert("Error: " + (data.error || "Failed to add order."));
        }
    })
    .catch(error => console.error("Error adding order:", error));
}

// Load all orders for the orders table
function loadOrders() {
    fetch("/get_orders")
    .then(response => response.json())
    .then(orders => {
        let ordersTable = document.getElementById("ordersTableBody");
        ordersTable.innerHTML = "";
        orders.forEach(order => addOrderToTable(order));
        updateOrderCounts();
    })
    .catch(error => console.error("Error loading orders:", error));
}

// Add an order to the orders table
function addOrderToTable(order) {
    let ordersTable = document.getElementById("ordersTableBody");

    if (document.getElementById(`row-${order.orderId}`)) return;

    let row = ordersTable.insertRow();
    row.id = `row-${order.orderId}`;

    row.insertCell(0).textContent = order.orderId;
    row.insertCell(1).textContent = order.customerName;
    row.insertCell(2).textContent = order.orderDate;
    row.insertCell(3).textContent = `₹${parseFloat(order.orderAmount || 0).toLocaleString()}`;

    let statusCell = row.insertCell(4);
    statusCell.textContent = order.orderStatus;
    statusCell.classList.add(getStatusClass(order.orderStatus));

    let actionCell = row.insertCell(5);
    let deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-btn");
    deleteButton.onclick = () => deleteOrder(order.orderId);
    actionCell.appendChild(deleteButton);
}

// Delete an order
function deleteOrder(orderId) {
    if (!confirm("Are you sure you want to delete this order?")) return;

    fetch(`/delete_order/${orderId}`, { method: "DELETE" })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Order deleted successfully!");
            document.getElementById(`row-${orderId}`).remove();
            updateOrderCounts();
        } else {
            alert("Error deleting order.");
        }
    })
    .catch(error => console.error("Error:", error));
}

// Update the order counts (Pending, Shipped, Delivered, Returned)
function updateOrderCounts() {
    fetch("/get_orders")
    .then(response => response.json())
    .then(orders => {
        let pendingCount = 0, shippedCount = 0, deliveredCount = 0, returnedCount = 0;

        orders.forEach(order => {
            switch (order.orderStatus) {
                case "Pending": pendingCount++; break;
                case "Shipped": shippedCount++; break;
                case "Delivered": deliveredCount++; break;
                case "Returned": returnedCount++; break;
            }
        });

        document.getElementById("pendingCount").textContent = pendingCount;
        document.getElementById("shippedCount").textContent = shippedCount;
        document.getElementById("deliveredCount").textContent = deliveredCount;
        document.getElementById("returnedCount").textContent = returnedCount;
    })
    .catch(error => console.error("Error updating order counts:", error));
}

// Return a class based on the order status (for color coding)
function getStatusClass(status) {
    switch (status) {
        case "Pending": return "pending";
        case "Shipped": return "shipped";
        case "Delivered": return "delivered";
        case "Returned": return "returned";
        default: return "";
    }
}
