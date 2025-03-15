document.addEventListener("DOMContentLoaded", function () {
    const productDetailsSection = document.getElementById("productDetailsSection");
    const advancedDetailsSection = document.getElementById("advancedDetailsSection");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const saveBtn = document.getElementById("saveBtn");

    const productTab = document.getElementById("showProductDetails");
    const advancedTab = document.getElementById("showAdvancedDetails");

    // Handle tab clicks
    productTab.addEventListener("click", function (e) {
        e.preventDefault();
        productDetailsSection.style.display = "block";
        advancedDetailsSection.style.display = "none";

        prevBtn.style.display = "none";
        nextBtn.style.display = "block";
        saveBtn.style.display = "none";

        productTab.classList.add("active");
        advancedTab.classList.remove("active");
    });

    advancedTab.addEventListener("click", function (e) {
        e.preventDefault();
        productDetailsSection.style.display = "none";
        advancedDetailsSection.style.display = "block";

        prevBtn.style.display = "block";
        nextBtn.style.display = "none";
        saveBtn.style.display = "block";

        advancedTab.classList.add("active");
        productTab.classList.remove("active");
    });

    // Handle button navigation
    nextBtn.addEventListener("click", function () {
        productDetailsSection.style.display = "none";
        advancedDetailsSection.style.display = "block";

        prevBtn.style.display = "block";
        nextBtn.style.display = "none";
        saveBtn.style.display = "block";

        advancedTab.classList.add("active");
        productTab.classList.remove("active");
    });

    prevBtn.addEventListener("click", function () {
        productDetailsSection.style.display = "block";
        advancedDetailsSection.style.display = "none";

        prevBtn.style.display = "none";
        nextBtn.style.display = "block";
        saveBtn.style.display = "none";

        productTab.classList.add("active");
        advancedTab.classList.remove("active");
    });
});
