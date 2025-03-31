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
