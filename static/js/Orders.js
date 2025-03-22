document.addEventListener("DOMContentLoaded", function () {
    loadOrders();

    // Handle order form submission
    document.getElementById("addOrderForm").addEventListener("submit", function (event) {
        event.preventDefault();
        addOrder();
    });

    // Open modal on button click
    document.getElementById("addOrderBtn").addEventListener("click", function () {
        toggleOrderModal(true);
    });

    // Close modal when clicking close button
    document.getElementById("closeModal").addEventListener("click", function () {
        toggleOrderModal(false);
    });

    // Close modal when clicking outside of it
    window.addEventListener("click", function (event) {
        let modal = document.getElementById("orderModal");
        if (event.target === modal) {
            toggleOrderModal(false);
        }
    });
});

// Toggle Order Modal
function toggleOrderModal(show) {
    let modal = document.getElementById("orderModal");
    if (!modal) return;

    if (show) {
        modal.style.display = "flex";
        setTimeout(() => modal.classList.add("show"), 10);
    } else {
        modal.classList.remove("show");
        setTimeout(() => modal.style.display = "none", 300);
    }
}

// Add Order to Firebase
function addOrder() {
    let orderId = document.getElementById("orderId").value.trim();
    let customerName = document.getElementById("customerName").value.trim();
    let orderDate = document.getElementById("orderDate").value;
    let orderStatus = document.getElementById("orderStatus").value;

    if (!orderId || !customerName || !orderDate) {
        alert("Please fill in all fields.");
        return;
    }

    let orderData = { orderId, customerName, orderDate, orderStatus };

    fetch("/add_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Order added successfully!");
            document.getElementById("addOrderForm").reset();
            toggleOrderModal(false);
            addOrderToTable(orderData); // Add directly without reloading
        } else {
            alert("Error: " + (data.error || "Failed to add order."));
        }
    })
    .catch(error => console.error("Error:", error));
}

// Load Orders from Firebase
function loadOrders() {
    fetch("/get_orders")
    .then(response => response.json())
    .then(orders => {
        let ordersTable = document.getElementById("ordersTableBody");
        ordersTable.innerHTML = ""; // Clear table before loading new orders

        let pending = 0, shipped = 0, delivered = 0, returned = 0;

        orders.forEach(order => {
            addOrderToTable(order);
            if (order.orderStatus === "Pending") pending++;
            if (order.orderStatus === "Shipped") shipped++;
            if (order.orderStatus === "Delivered") delivered++;
            if (order.orderStatus === "Returned") returned++;
        });

        document.getElementById("pendingCount").textContent = pending;
        document.getElementById("shippedCount").textContent = shipped;
        document.getElementById("deliveredCount").textContent = delivered;
        document.getElementById("returnedCount").textContent = returned;
    })
    .catch(error => console.error("Error loading orders:", error));
}

// Add Order Row to Table (without reloading)
function addOrderToTable(order) {
    let ordersTable = document.getElementById("ordersTableBody");

    // Check if order already exists to prevent duplicates
    if (document.getElementById(`row-${order.orderId}`)) {
        console.warn(`Order ID ${order.orderId} already exists!`);
        return;
    }

    let row = ordersTable.insertRow();
    row.id = `row-${order.orderId}`;
    row.insertCell(0).textContent = order.orderId;
    row.insertCell(1).textContent = order.customerName;
    row.insertCell(2).textContent = order.orderDate;
    row.insertCell(3).textContent = order.orderStatus;

    let actionCell = row.insertCell(4);
    
    // Create delete button
    let deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-btn");
    deleteButton.onclick = () => deleteOrder(order.orderId);
    
    actionCell.appendChild(deleteButton);
}

// Delete Order
function deleteOrder(orderId) {
    if (!confirm("Are you sure you want to delete this order?")) return;

    fetch("/delete_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Order deleted successfully!");
            let row = document.getElementById(`row-${orderId}`);
            if (row) row.remove();
        } else {
            alert("Error deleting order!");
        }
    })
    .catch(error => console.error("Error:", error));
}
