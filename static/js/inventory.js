document.addEventListener("DOMContentLoaded", function () {
    const addItemBtn = document.getElementById("addItemBtn");
    const inventoryTable = document.getElementById("inventoryTable");

    // Function to create table row dynamically
    function addToTable(id, name, category, stock) {
        const newRow = document.createElement("tr");
        newRow.setAttribute("data-id", id);  // Unique ID for easy deletion

        newRow.innerHTML = `
            <td>${name}</td>
            <td>${category}</td>
            <td class="stock-status">${stock}</td>
            <td>
                <button class="edit-btn" onclick="editItem(${id}, '${name}', '${category}', ${stock})">Edit</button>
                <button class="delete-btn" onclick="deleteItem(${id})">Delete</button>
            </td>
        `;
        inventoryTable.appendChild(newRow);
    }

    // Fetch Existing Items from Database and Populate Table (on page load)
    fetch("/get_inventory")
        .then(response => response.json())
        .then(data => {
            data.forEach(item => addToTable(item.id, item.name, item.category, item.stock));
        })
        .catch(error => console.error("Error loading inventory:", error));

    // Add New Item
    addItemBtn?.addEventListener("click", function () {
        const name = prompt("Enter item name:").trim();
        const category = prompt("Enter item category:").trim();
        const stock = parseInt(prompt("Enter stock quantity:"));

        if (!name || !category || isNaN(stock) || stock < 0) {
            alert("Invalid input. Please enter valid details.");
            return;
        }

        fetch("/add_item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, category, stock })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addToTable(data.id, name, category, stock);  // ✅ Add new row dynamically
                alert("Item added successfully!");
            } else {
                alert("Failed to add item.");
            }
        })
        .catch(error => console.error("Error:", error));
    });

    // Edit Item
    window.editItem = function (id, name, category, stock) {
        const newStock = parseInt(prompt(`Update stock for ${name}:`, stock));

        if (isNaN(newStock) || newStock < 0) {
            alert("Invalid stock quantity.");
            return;
        }

        fetch(`/edit_item/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stock: newStock })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelector(`[data-id='${id}'] .stock-status`).textContent = newStock;
                alert("Item updated successfully!");
            } else {
                alert("Failed to update item.");
            }
        })
        .catch(error => console.error("Error:", error));
    };

    // Delete Item
    window.deleteItem = function (id) {
        if (!confirm("Are you sure you want to delete this item?")) return;

        fetch(`/delete_item/${id}`, { method: "DELETE" })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelector(`[data-id='${id}']`).remove();  // ✅ Remove row dynamically
                alert("Item deleted successfully!");
            } else {
                alert("Failed to delete item.");
            }
        })
        .catch(error => console.error("Error:", error));
    };
});
