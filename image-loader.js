// 🔹 Funkcja pobierająca zdjęcia z GitHuba
async function getLocationImages(name) {
    const githubRepo = "https://raw.githubusercontent.com/NAZWA_UŻYTKOWNIKA/NAZWA_REPOZYTORIUM/main/";
    const folderName = name.replace(/\s/g, "_"); // Zamiana spacji na podkreślniki
    const folderUrl = `${githubRepo}${encodeURIComponent(folderName)}/`;
    const imageExtensions = ["jpg", "jpeg", "webp"];
    let images = [];

    try {
        const response = await fetch(`https://api.github.com/repos/NAZWA_UŻYTKOWNIKA/NAZWA_REPOZYTORIUM/contents/${encodeURIComponent(folderName)}`);
        if (response.ok) {
            const data = await response.json();
            images = data
                .filter(file => imageExtensions.includes(file.name.split('.').pop().toLowerCase()))
                .slice(0, 5) // Maksymalnie 5 zdjęć
                .map(file => `${folderUrl}${file.name}`);
        }
    } catch (error) {
        console.warn(`Brak folderu ze zdjęciami dla: ${name}`);
    }

    return images;
}

// 🔹 Funkcja generująca slider dla popupu
async function generateImageSlider(name) {
    const images = await getLocationImages(name);

    if (images.length === 0) return ""; // Brak zdjęć – nie dodajemy slidera

    return `
        <div class="swiper-container" style="width:100%; height: 150px;">
            <div class="swiper-wrapper">
                ${images.map(img => `<div class="swiper-slide"><img src="${img}" style="width:100%; height:150px; object-fit:cover; border-radius:8px;"></div>`).join("")}
            </div>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
        </div>
        <script>
            new Swiper('.swiper-container', {
                loop: true,
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
            });
        </script>
    `;
}
