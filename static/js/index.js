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

            // Use a Map to store unique items by name
            const uniqueItemsMap = new Map();
            data.forEach(item => {
                if (!uniqueItemsMap.has(item.name)) {
                    uniqueItemsMap.set(item.name, item);
                }
            });

            // Clear previous content (optional if this runs multiple times)
            productDetailsDiv.innerHTML = "";

            // Display unique items
            uniqueItemsMap.forEach(item => {
                const itemDiv = document.createElement("div");
                itemDiv.classList.add("item");
                itemDiv.innerHTML = `<span>${item.name}</span> <span>${item.stock}</span>`;
                productDetailsDiv.appendChild(itemDiv);
            });
        })
        .catch(error => console.error("Error fetching inventory:", error));
});


document.addEventListener("DOMContentLoaded", function () {
    fetchRecentMembers();
});

function fetchRecentMembers() {
    fetch('/api/recent_members')  // Fetch from the new API
        .then(response => response.json())
        .then(data => {
            updateRecentMembers(data);
        })
        .catch(error => console.error("Error fetching recent members:", error));
}

function updateRecentMembers(members) {
    const recentMembersDiv = document.getElementById("recent-members");

    if (!members.length) {
        recentMembersDiv.innerHTML = "<p>No recent members.</p>";
        return;
    }

    let membersHTML = members.map(member => `
        <div class="member-item">
            <p><strong>Name:</strong> ${member.name || 'Unknown'}</p>
            <p><strong>Permission:</strong> ${member.permission || 'Unknown'}</p>
            <hr>
        </div>
    `).join("");

    recentMembersDiv.innerHTML = membersHTML;
}