setTimeout(() => {
    if (typeof map === "undefined") {
        console.error("❌ Zmienna 'map' nie została zainicjalizowana przed użyciem.");
    } else {
        console.log("✅ Mapa poprawnie załadowana.");
    }
}, 1000);

// 🔹 Pobieranie zdjęć z GitHuba
async function getLocationImages(name) {
    const githubRepo = "https://api.github.com/repos/campteamdev/Stronga-g/contents/";
    const folderName = encodeURIComponent(name.replace(/\s/g, "_")); 
    let images = [];

    console.log(`📂 Sprawdzanie folderu: ${folderName}`);

    try {
        const response = await fetch(`${githubRepo}${folderName}`);
        if (!response.ok) {
            console.warn(`⚠️ Folder nie znaleziony: ${folderName}`);
            return [];
        }

        const data = await response.json();
        console.log(`📂 Lista plików w folderze ${name}:`, data);

        images = data
            .filter(file => file.download_url && /\.(jpg|jpeg|webp)$/i.test(file.name))
            .map(file => file.download_url)
            .slice(0, 5);  // Maksymalnie 5 zdjęć

        console.log(`✅ Zdjęcia dla ${name}:`, images);
    } catch (error) {
        console.error(`❌ Błąd pobierania zdjęć z GitHuba dla ${name}:`, error);
    }

    return images;
}

// 🔹 Funkcja inicjalizująca Swiper
function initializeSwiper(name, images) {
    const sliderId = `.swiper-container-${name.replace(/\s/g, "_")}`;
    const prevBtnId = `#swiper-prev-${name.replace(/\s/g, "_")}`;
    const nextBtnId = `#swiper-next-${name.replace(/\s/g, "_")}`;

    setTimeout(() => {
        const swiper = new Swiper(sliderId, {
            loop: false,
            autoplay: false,
            pagination: { el: `${sliderId} .swiper-pagination`, clickable: true },
            slidesPerView: 1,
            spaceBetween: 10,
            navigation: {
                nextEl: nextBtnId,
                prevEl: prevBtnId
            }
        });

        console.log(`✅ Swiper zainicjalizowany dla ${name}`);

        // Obsługa powiększenia zdjęcia
        document.querySelectorAll(`${sliderId} .zoomable-image`).forEach((img, index) => {
            img.addEventListener("click", () => openFullscreen(images, index));
        });

    }, 500);
}

// 🔹 Funkcja generująca slider zdjęć
async function generateImageSlider(name) {
    const images = await getLocationImages(name);
    if (images.length === 0) return "";

    console.log(`✅ Generowanie slidera dla: ${name} (${images.length} zdjęć)`);

    const sliderId = `swiper-container-${name.replace(/\s/g, "_")}`;
    const prevBtnId = `swiper-prev-${name.replace(/\s/g, "_")}`;
    const nextBtnId = `swiper-next-${name.replace(/\s/g, "_")}`;

    return `
        <div class="swiper-container ${sliderId}" style="width:100%; height: 150px; position: relative; overflow: hidden;">
            <div class="swiper-wrapper">
                ${images.map(img => `
                    <div class="swiper-slide">
                        <img src="${img}" class="zoomable-image" style="width:100%; height:150px; object-fit:cover; border-radius:8px; cursor:pointer;">
                    </div>
                `).join("")}
            </div>
            <div class="swiper-pagination" style="position:absolute; bottom:5px; left:50%; transform:translateX(-50%);"></div>

            <div id="${prevBtnId}" class="swiper-button-prev"></div>
            <div id="${nextBtnId}" class="swiper-button-next"></div>
        </div>
    `;
}

// 🔹 Funkcja do powiększania zdjęcia i zmiany
function openFullscreen(images, index) {
    if (document.getElementById("fullscreen-view")) return;

    let currentIndex = index;

    const fullscreenContainer = document.createElement("div");
    fullscreenContainer.id = "fullscreen-view";
    fullscreenContainer.style.position = "fixed";
    fullscreenContainer.style.top = "0";
    fullscreenContainer.style.left = "0";
    fullscreenContainer.style.width = "100%";
    fullscreenContainer.style.height = "100%";
    fullscreenContainer.style.background = "rgba(0, 0, 0, 0.9)";
    fullscreenContainer.style.display = "flex";
    fullscreenContainer.style.justifyContent = "center";
    fullscreenContainer.style.alignItems = "center";
    fullscreenContainer.style.zIndex = "9999";

    const img = document.createElement("img");
    img.src = images[currentIndex];
    img.style.maxWidth = "95%";
    img.style.maxHeight = "95%";

    fullscreenContainer.appendChild(img);
    document.body.appendChild(fullscreenContainer);

    fullscreenContainer.addEventListener("click", () => {
        document.body.removeChild(fullscreenContainer);
    });

    console.log("✅ Powiększenie zdjęcia otwarte:", images[currentIndex]);
}

// 🔹 Nasłuchiwanie otwarcia popupu i dodawanie zdjęć
map.on("popupopen", async function (e) {
    await updatePopupWithImages(e.popup._contentNode);
});
