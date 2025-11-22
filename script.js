async function loadImages() {
    const res = await fetch("/images");
    const images = await res.json();
    const gallery = document.getElementById("gallery");

    gallery.innerHTML = "";

    images.forEach(img => {
        const imgEl = document.createElement("img");
        imgEl.src = "/uploads/" + img;
        imgEl.dataset.name = img.toLowerCase();
        gallery.appendChild(imgEl);
    });
}

// search function
document.getElementById("search").addEventListener("input", () => {
    const term = document.getElementById("search").value.toLowerCase();
    const images = document.querySelectorAll(".gallery img");

    images.forEach(img => {
        img.style.display = img.dataset.name.includes(term) ? "block" : "none";
    });
});

loadImages();
