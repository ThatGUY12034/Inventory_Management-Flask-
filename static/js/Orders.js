function toggleDropdown() {
    var dropdown = document.getElementById("dropdownMenu");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

// Hide dropdown when clicking outside
window.onclick = function(event) {
    if (!event.target.matches('.profile-img')) {
        document.getElementById("dropdownMenu").style.display = "none";
    }
};
