document.addEventListener("DOMContentLoaded", function () {
    loadOrders();

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

function addOrderToTable(order) {
    let ordersTable = document.getElementById("ordersTableBody");

    if (document.getElementById(`row-${order.orderId}`)) return;

    let row = ordersTable.insertRow();
    row.id = `row-${order.orderId}`;

    row.insertCell(0).textContent = order.orderId;
    row.insertCell(1).textContent = order.customerName;
    row.insertCell(2).textContent = order.orderDate;
    row.insertCell(3).textContent = `₹${order.orderAmount}`;

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

function getStatusClass(status) {
    switch (status) {
        case "Pending": return "pending";
        case "Shipped": return "shipped";
        case "Delivered": return "delivered";
        case "Returned": return "returned";
        default: return "";
    }
}
