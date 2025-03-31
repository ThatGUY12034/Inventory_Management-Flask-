document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JavaScript Loaded!"); // Debugging

    document.getElementById("addMemberForm").addEventListener("submit", function (event) {
        event.preventDefault();
        addOrUpdateMember();
    });

    loadMembers(); // Load existing members
});

let editMemberId = null; // Stores member ID when editing

// Function to fetch the latest members and display them
// Function to fetch the latest 5 members and display them
function loadRecentMembers() {
    fetch('/api/recent_members')  // Endpoint to fetch the latest members (ensure the backend is set up for this)
        .then(response => response.json())
        .then(members => {
            let membersList = document.getElementById("recentMembersList");
            membersList.innerHTML = "";  // Clear previous content

            if (members.length === 0) {
                membersList.innerHTML = "<p>No recent members found.</p>";
                return;
            }

            members.forEach(member => {
                const memberDiv = document.createElement("div");
                memberDiv.classList.add("item");

                // Insert member information dynamically
                memberDiv.innerHTML = `
                    <span>Name: ${member.name}</span><br>
                    <span>Address: ${member.address}</span><br>
                    <span>Contact: ${member.contact}</span><br>
                    <span>Email: ${member.email}</span><br>
                    <span>Permission: ${member.permission}</span>
                `;

                membersList.appendChild(memberDiv);
            });
        })
        .catch(error => console.error("❌ Error loading recent members:", error));
}

// Function to show the form (for adding or editing)
function openForm(member = null) {
    const form = document.getElementById("memberForm");
    form.classList.remove("hidden"); // Show form

    if (member) {
        // Populate form fields when editing
        document.getElementById("name").value = member.name;
        document.getElementById("address").value = member.address;
        document.getElementById("contact").value = member.contact;
        document.getElementById("mail").value = member.mail;
        document.getElementById("permission").value = member.permission;
        editMemberId = member.id; // Store ID for updating

        document.getElementById("formTitle").textContent = "Edit Member";
        document.getElementById("submitBtn").textContent = "Update";
    } else {
        // Clear form for new member
        document.getElementById("addMemberForm").reset();
        editMemberId = null;

        document.getElementById("formTitle").textContent = "Add New Member";
        document.getElementById("submitBtn").textContent = "Save";
    }
}

// Function to hide the form
function closeForm() {
    document.getElementById("memberForm").classList.add("hidden");
}

// Function to add or update a member
function addOrUpdateMember() {
    let name = document.getElementById("name").value.trim();
    let address = document.getElementById("address").value.trim();
    let contact = document.getElementById("contact").value.trim();
    let mail = document.getElementById("mail").value.trim();
    let permission = document.getElementById("permission").value.trim();

    if (!name || !address || !contact || !mail || !permission) {
        alert("⚠️ Please fill in all fields.");
        return;
    }

    let memberData = { name, address, contact, mail, permission };

    if (editMemberId) {
        // Update existing member
        fetch(`/update_member/${editMemberId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(memberData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("✅ Member updated successfully!");
                closeForm();
                loadMembers();
            } else {
                alert("❌ Error: " + (data.error || "Failed to update member."));
            }
        })
        .catch(error => console.error("🚨 Error updating member:", error));
    } else {
        // Add new member
        fetch("/add_member", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(memberData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("✅ Member added successfully!");
                closeForm();
                loadMembers();
            } else {
                alert("❌ Error: " + (data.error || "Failed to add member."));
            }
        })
        .catch(error => console.error("🚨 Error adding member:", error));
    }
}

// Function to load members from Firebase
function loadMembers() {
    fetch("/get_members")
    .then(response => response.json())
    .then(members => {
        let membersTable = document.getElementById("membersTable");
        membersTable.innerHTML = ""; // Clear previous entries

        members.forEach((member, index) => {
            let row = membersTable.insertRow();
            row.insertCell(0).textContent = index + 1; // Serial Number
            row.insertCell(1).textContent = member.name;
            row.insertCell(2).textContent = member.address;
            row.insertCell(3).textContent = member.contact;
            row.insertCell(4).textContent = member.mail;
            row.insertCell(5).textContent = member.permission;

            // Actions: Edit & Delete
            let actionCell = row.insertCell(6);
            
            // Edit button
            let editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.className = "bg-yellow-500 text-white px-3 py-1 rounded mr-2";
            editButton.onclick = () => openForm(member);
            actionCell.appendChild(editButton);

            // Delete button
            let deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "bg-red-500 text-white px-3 py-1 rounded";
            deleteButton.onclick = () => deleteMember(member.id);
            actionCell.appendChild(deleteButton);
        });
    })
    .catch(error => console.error("❌ Error loading members:", error));
}

// Function to delete a member
function deleteMember(memberId) {
    if (!confirm("🗑️ Are you sure you want to delete this member?")) return;

    fetch(`/delete_member/${memberId}`, { method: "DELETE" })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("✅ Member deleted successfully!");
            loadMembers();
        } else {
            alert("❌ Error: " + (data.error || "Failed to delete member."));
        }
    })
    .catch(error => console.error("❌ Error deleting member:", error));
}


// Function to export members data to Excel
function exportToExcel() {
    fetch("/get_members")
    .then(response => response.json())
    .then(members => {
        let worksheet = XLSX.utils.json_to_sheet(members);
        let workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

        XLSX.writeFile(workbook, "Members_List.xlsx");
        alert("✅ Excel file downloaded!");
    })
    .catch(error => console.error("❌ Error exporting to Excel:", error));
}

// Function to export members data to CSV
function exportToCSV() {
    fetch("/get_members")
    .then(response => response.json())
    .then(members => {
        let csvContent = "data:text/csv;charset=utf-8," +
            "S.No,Name,Address,Contact,Email,Permission\n" +
            members.map((m, index) => `${index + 1},${m.name},${m.address},${m.contact},${m.mail},${m.permission}`).join("\n");

        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Members_List.csv");
        document.body.appendChild(link);
        link.click();
        alert("✅ CSV file downloaded!");
    })
    .catch(error => console.error("❌ Error exporting to CSV:", error));
}

// Function to print the members table
function printTable() {
    let tableContent = document.getElementById("membersTable").parentElement.innerHTML;
    let newWindow = window.open("", "_blank");
    newWindow.document.write(`
        <html>
        <head>
            <title>Print Members</title>
            <style>
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h2>Members List</h2>
            <table>${tableContent}</table>
            <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
        </html>
    `);
    newWindow.document.close();
}
