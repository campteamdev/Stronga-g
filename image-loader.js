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


// 🔹 Funkcja generująca slider zdjęć
async function generateImageSlider(name) {
    const images = await getLocationImages(name);
    if (images.length === 0) return "";

    console.log(`✅ Generowanie slidera dla: ${name} (${images.length} zdjęć)`);

    // Unikalny identyfikator dla Swiper
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

            <!-- 🔹 Tylko nasze strzałki -->
            <div id="${prevBtnId}" class="custom-swiper-prev" style="
                position:absolute; 
                top:50%; 
                left:5px; 
                transform:translateY(-50%);
                width:25px; 
                height:25px;
                background-color: rgba(0, 0, 0, 0.6); 
                border-radius:50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: opacity 0.3s;
                z-index: 10;
            " onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
                <span style="color:white; font-size:16px; font-weight:bold;">❮</span>
            </div>

            <div id="${nextBtnId}" class="custom-swiper-next" style="
                position:absolute; 
                top:50%; 
                right:5px; 
                transform:translateY(-50%);
                width:25px; 
                height:25px;
                background-color: rgba(0, 0, 0, 0.6); 
                border-radius:50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: opacity 0.3s;
                z-index: 10;
            " onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
                <span style="color:white; font-size:16px; font-weight:bold;">❯</span>
            </div>
        </div>

        <script>
            setTimeout(() => {
                const swiper = new Swiper('.${sliderId}', {
                    loop: true,
                    pagination: { el: '.swiper-pagination', clickable: true },
                    slidesPerView: 1,
                    spaceBetween: 10,
                    navigation: false // ⬅️ WYŁĄCZAMY DOMYŚLNE STRZAŁKI SWIPER
                });

                // 🔹 Obsługa naszych własnych strzałek
                document.getElementById('${prevBtnId}').addEventListener('click', () => swiper.slidePrev());
                document.getElementById('${nextBtnId}').addEventListener('click', () => swiper.slideNext());

                // 🔹 Powiększanie zdjęcia po kliknięciu
                document.querySelectorAll('.${sliderId} .zoomable-image').forEach(img => {
                    img.addEventListener('click', () => openFullscreen(img.src));
                });
            }, 500);
        </script>
    `;
}


// 🔹 Dodawanie zdjęć do popupu po otwarciu
async function updatePopupWithImages(popup) {
    // Usunięcie istniejącego slidera (zapobiega podwójnemu wyświetlaniu)
    const existingSlider = popup.querySelector(".swiper-container");
    if (existingSlider) {
        existingSlider.remove();
    }

    const nameElement = popup.querySelector("div");
    if (!nameElement) return;

    const name = nameElement.textContent.trim();
    const imageSlider = await generateImageSlider(name);

    if (imageSlider) {
        popup.insertAdjacentHTML("afterbegin", imageSlider);
        initializeSwiper(name); // ⬅️ Dodane tutaj
    }
}




// 🔹 Nasłuchiwanie otwarcia popupu i dodawanie zdjęć
map.on("popupopen", async function (e) {
    await updatePopupWithImages(e.popup._contentNode);
});
function initializeSwiper(name) {
    const sliderId = `swiper-container-${name.replace(/\s/g, "_")}`;

    setTimeout(() => {
        new Swiper(`.${sliderId}`, {
            loop: true,
            pagination: { el: `.${sliderId} .swiper-pagination`, clickable: true },
            navigation: { nextEl: `.${sliderId} .swiper-button-next`, prevEl: `.${sliderId} .swiper-button-prev` },
            autoplay: { delay: 3000 },
            slidesPerView: 1,
            spaceBetween: 10
        });
    }, 500);
}

