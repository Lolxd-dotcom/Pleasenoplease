async function loadImages() {
    const res = await fetch("/images");
    const files = await res.json();
    const gallery = document.getElementById("gallery");

    gallery.innerHTML = "";

    files.forEach(name => {
        const img = document.createElement("img");
        img.src = "/uploads/" + name;
        img.dataset.name = name.toLowerCase();
        gallery.appendChild(img);
    });
}

document.getElementById("search").addEventListener("input", e => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll(".gallery img").forEach(img => {
        img.style.display = img.dataset.name.includes(term) ? "block" : "none";
    });
});

loadImages();
