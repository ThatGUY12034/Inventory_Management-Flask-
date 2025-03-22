
document.addEventListener("DOMContentLoaded", function () {
    const inventoryTable = document.getElementById("inventoryTable");
    const addItemBtn = document.getElementById("addItemBtn");
    const modal = document.getElementById("modal");
    const closeModal = document.getElementById("closeModal");
    const saveBtn = document.getElementById("saveBtn");

    const modalTitle = document.getElementById("modalTitle");
    const itemName = document.getElementById("itemName");
    const itemCategory = document.getElementById("itemCategory");
    const itemStock = document.getElementById("itemStock");

    let editingItemId = null; // Track if we are editing an item

    // ✅ Fetch inventory items on page load
    async function fetchInventory() {
        try {
            const response = await fetch("/inventory", { headers: { "X-Requested-With": "XMLHttpRequest" } });
            const data = await response.json();

            inventoryTable.innerHTML = ""; // Clear existing items
            data.inventory.forEach(item => addInventoryRow(item));
        } catch (error) {
            console.error("Error fetching inventory:", error);
        }
    }

    // ✅ Show the modal for adding/editing
    function openModal(editItem = null) {
        modal.classList.add("show"); // Show modal

        if (editItem) {
            modalTitle.textContent = "Edit Item";
            itemName.value = editItem.name;
            itemCategory.value = editItem.category;
            itemStock.value = editItem.stock;
            editingItemId = editItem.id;
        } else {
            modalTitle.textContent = "Add New Item";
            itemName.value = "";
            itemCategory.value = "";
            itemStock.value = "";
            editingItemId = null;
        }
    }

    // ✅ Close the modal
    function closeModalHandler() {
        modal.classList.remove("show");
    }

    // ✅ Add/Edit inventory item
    async function addOrUpdateItem() {
        const name = itemName.value.trim();
        const category = itemCategory.value.trim();
        const stock = parseInt(itemStock.value.trim());

        if (!name || !category || isNaN(stock) || stock < 0) {
            alert("Invalid input! Please enter valid details.");
            return;
        }

        let url, method;
        const itemData = { name, category, stock };

        if (editingItemId) {
            // Update existing item
            url = `/edit_item/${editingItemId}`;
            method = "POST";
        } else {
            // Add new item
            url = "/add_item";
            method = "POST";
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(itemData),
            });

            const data = await response.json();
            alert(data.message);
            closeModalHandler();
            fetchInventory();
        } catch (error) {
            console.error("Error saving item:", error);
        }
    }

    // ✅ Delete an inventory item
    async function deleteItem(itemId) {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const response = await fetch(`/delete_item/${itemId}`, { method: "DELETE" });
            const data = await response.json();
            alert(data.message);
            fetchInventory();
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    }

    // ✅ Add a row to the table
    function addInventoryRow(item) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td class="stock-status">${item.stock}</td>
            <td>
                <button class="edit-btn" data-id="${item.id}">Edit</button>
                <button class="delete-btn" data-id="${item.id}">Delete</button>
            </td>
        `;

        row.querySelector(".edit-btn").addEventListener("click", () => openModal(item));
        row.querySelector(".delete-btn").addEventListener("click", () => deleteItem(item.id));

        inventoryTable.appendChild(row);
    }

    // ✅ Event Listeners
    addItemBtn.addEventListener("click", () => openModal());
    closeModal.addEventListener("click", closeModalHandler);
    saveBtn.addEventListener("click", addOrUpdateItem);

    // ✅ Initial Fetch
    fetchInventory();
});