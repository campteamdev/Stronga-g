setTimeout(() => {
    if (typeof map === "undefined") {
        console.error("❌ Zmienna 'map' nie została zainicjalizowana przed użyciem.");
    } else {
        console.log("✅ Mapa poprawnie załadowana.");
    }
}, 1000);

// 🔹 Pobieranie zdjęć z GitHuba
async function getLocationImages(name) {
    const githubRepo = "https://raw.githubusercontent.com/campteamdev/Stronga-g/main/";
    const folderName = name.replace(/\s/g, "_"); // Zamiana spacji na podkreślniki
    const folderUrl = `${githubRepo}${encodeURIComponent(folderName)}/`;
    const imageExtensions = ["jpg", "jpeg", "webp"];
    let images = [];

    console.log(`📂 Sprawdzanie folderu: ${folderName}`);

    try {
        const response = await fetch(`https://api.github.com/repos/campteamdev/Stronga-g/contents/${encodeURIComponent(folderName)}`);
        
        if (!response.ok) {
            console.warn(`⚠️ Folder nie znaleziony: ${folderName}`);
            return [];
        }

        const data = await response.json();
        images = data
            .filter(file => imageExtensions.includes(file.name.split('.').pop().toLowerCase()))
            .slice(0, 5) // Maksymalnie 5 zdjęć
            .map(file => {
                console.log(`✅ Znaleziono obraz: ${file.download_url}`);
                return file.download_url;
            });

    } catch (error) {
        console.error("❌ Błąd pobierania zdjęć z GitHuba:", error);
    }

    return images;
}

// 🔹 Funkcja generująca slider zdjęć
async function generateImageSlider(name) {
    const images = await getLocationImages(name);

    if (images.length === 0) return ""; // Jeśli brak zdjęć, nie dodajemy slidera

    console.log(`✅ Generowanie slidera dla: ${name} (${images.length} zdjęć)`);

    // Unikalny identyfikator slidera
    const sliderId = `swiper-container-${name.replace(/\s/g, "_")}`;

    return `
        <div class="swiper-container ${sliderId}" style="width:100%; height: 150px; position: relative;">
            <div class="swiper-wrapper">
                ${images.map(img => `
                    <div class="swiper-slide">
                        <img src="${img}" style="width:100%; height:150px; object-fit:cover; border-radius:8px;">
                    </div>
                `).join("")}
            </div>
            <div class="swiper-pagination" style="position:absolute; bottom:5px; left:50%; transform:translateX(-50%);"></div>
            <div class="swiper-button-prev" style="position:absolute; top:50%; left:10px; transform:translateY(-50%); color:white;"></div>
            <div class="swiper-button-next" style="position:absolute; top:50%; right:10px; transform:translateY(-50%); color:white;"></div>
        </div>
        <script>
            setTimeout(() => {
                new Swiper('.${sliderId}', {
                    loop: true,
                    pagination: { el: '.swiper-pagination', clickable: true },
                    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                    autoplay: { delay: 3000 },
                    slidesPerView: 1,
                    spaceBetween: 10
                });
            }, 500);
        </script>
    `;
}



// 🔹 Dodawanie zdjęć do popupu po otwarciu
async function updatePopupWithImages(popup) {
    const nameElement = popup.querySelector("div");  
    if (!nameElement) return;  

    const name = nameElement.textContent.trim();  
    const imageSlider = await generateImageSlider(name);  

    if (imageSlider) {
        popup.insertAdjacentHTML("afterbegin", imageSlider);
    }
}
map.on("popupopen", async function (e) {
    const popup = e.popup._contentNode;
    console.log("🔍 Otwarto popup dla:", popup.innerHTML); 

    const nameElement = popup.querySelector("div");
    if (!nameElement) {
        console.error("❌ Nie znaleziono nazwy lokalizacji w popupie!");
        return;
    }

    const name = nameElement.textContent.trim();
    console.log("🔍 Nazwa lokalizacji w popupie:", name);

    const imageSlider = await generateImageSlider(name);
    if (imageSlider) {
        console.log("✅ Slider generowany dla:", name);
        popup.insertAdjacentHTML("afterbegin", imageSlider);
    } else {
        console.warn("⚠️ Brak zdjęć dla:", name);
    }
});

// 🔹 Nasłuchiwanie otwarcia popupu i dodawanie zdjęć
map.on("popupopen", async function (e) {
    await updatePopupWithImages(e.popup._contentNode);
});
