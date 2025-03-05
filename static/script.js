document.addEventListener("DOMContentLoaded", function () {
    console.log("JavaScript Loaded!");

    // Sidebar Toggle Function
    const sidebar = document.querySelector(".bg-black");
    const links = document.querySelectorAll("nav a");

    links.forEach((link) => {
        link.addEventListener("mouseenter", () => {
            sidebar.style.width = "250px";
        });
        link.addEventListener("mouseleave", () => {
            sidebar.style.width = "64px";
        });
    });

    // Search Functionality
    const searchInput = document.querySelector("input[type='text']");
    searchInput.addEventListener("input", function () {
        let filter = searchInput.value.toLowerCase();
        let cards = document.querySelectorAll(".bg-white");

        cards.forEach((card) => {
            let text = card.innerText.toLowerCase();
            card.style.display = text.includes(filter) ? "" : "none";
        });
    });

    // Clickable Icons (For Future Enhancements)
    document.querySelectorAll("i").forEach((icon) => {
        icon.addEventListener("click", function () {
            alert("This feature is not yet implemented!");
        });
    });
});
