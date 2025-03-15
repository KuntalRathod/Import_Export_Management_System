document.addEventListener("DOMContentLoaded", () => {
    const unitForm = document.getElementById("unitForm");
    const formTitle = document.getElementById("formTitle");
    const unitIdInput = document.getElementById("unitId");
    const saveButton = document.getElementById("saveButton");
    const unitFormContainer = document.getElementById("unitFormContainer");
    const showFormBtn = document.getElementById("showFormBtn");
   
    const closeFormBtn = document.getElementById("closeFormBtn");

    
    showFormBtn.addEventListener("click", () => {
        unitFormContainer.classList.add("active"); 
    });

    
    closeFormBtn.addEventListener("click", () => {
        unitFormContainer.classList.remove("active"); 
    });

    let isEditing = false;

   
    window.editUnit = (id, orderUnit, packingUnit, weight, note) => {
        console.log("Edit button clicked!"); // Debugging

    // Ensure elements exist
        const formTitle = document.getElementById("formTitle");
        const unitIdInput = document.getElementById("unitId");
        const unitFormContainer = document.getElementById("unitFormContainer");

        if (!formTitle || !unitIdInput || !unitFormContainer) {
            console.error("Form elements not found!");
            return;
        }

        // Set form values
        formTitle.innerText = "Edit Unit";
        unitIdInput.value = id;
        document.getElementById("orderUnit").value = orderUnit;
        document.getElementById("packingUnit").value = packingUnit;
        document.getElementById("weight").value = weight;
        document.getElementById("noteForMe").value = note;

        // Update form state
        isEditing = true;
        document.getElementById("saveButton").innerText = "Update";
        document.getElementById("unitForm").setAttribute("data-method", "PUT");

        // Show the form correctly
        unitFormContainer.classList.remove("hidden"); // Remove hidden if it exists
        unitFormContainer.classList.add("active"); // Add active class for animation

        console.log("Form opened for editing!");
    };

    // Handle form submission
    unitForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const formData = new FormData(unitForm);
        const unitId = unitIdInput.value;
        const isUpdate = unitForm.getAttribute("data-method") === "PUT";

        const url = isUpdate ? `/unit/update/${unitId}` : "/unit/create";
        const method = isUpdate ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderUnit: formData.get("orderUnit"),
                    packingUnit: formData.get("packingUnit"),
                    weight: formData.get("weight"),
                    noteForMe: formData.get("noteForMe"),
                }),
            });
    
            // Ensure the response is JSON before parsing
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Invalid server response (not JSON)");
            }
    
            const data = await response.json();
            // alert(data.message);
    
            if (data.success) {
                location.reload();
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to save unit. Check console for details.");
        }
    });

    // Close form
    document.getElementById("closeFormBtn").addEventListener("click", () => {
        unitFormContainer.classList.remove("active");
        isEditing = false;
        saveButton.innerText = "Save";
        unitForm.setAttribute("data-method", "POST");
        unitForm.reset();
    });
});