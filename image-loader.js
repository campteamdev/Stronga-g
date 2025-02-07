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
    
    // 🔹 Funkcja normalizująca nazwę kempingu (usuwa polskie znaki, nadmiarowe spacje i myślniki)
    function normalizeName(str) {
        return str
            .trim() // Usunięcie spacji na początku i końcu
            .normalize("NFD") // Usunięcie polskich znaków
            .replace(/[\u0300-\u036f]/g, "") // Usunięcie akcentów
            .replace(/\s+/g, " ") // Zamiana wielokrotnych spacji na pojedynczą spację
            .replace(/[-]+/g, " ") // Zamiana myślników na spacje
            .trim(); // Ponowne usunięcie spacji na początku i końcu
    }

    // 🔹 Generowanie wariantów nazw folderów
    const baseName = normalizeName(name);
    const folderVariants = [
        encodeURIComponent(baseName),                        // Oryginalna nazwa (bez polskich znaków, z jedną spacją)
        encodeURIComponent(baseName.replace(/\s+/g, "_")),  // Zamiana wszystkich spacji na `_`
        encodeURIComponent(baseName.replace(/\s+/g, "-")),  // Zamiana wszystkich spacji na `-`
        encodeURIComponent(baseName.replace(/\s+/g, "")),   // Usunięcie wszystkich spacji
        encodeURIComponent(baseName.toLowerCase()),        // Małe litery
        encodeURIComponent(baseName.toUpperCase()),        // Wielkie litery
    ];

    let images = [];

    console.log(`📂 Sprawdzanie folderów dla: "${name}"`);

    for (let folderName of folderVariants) {
        try {
            console.log(`📂 Sprawdzam folder: "${folderName}"`);
            const response = await fetch(`${githubRepo}${folderName}`);

            if (response.ok) {
                const data = await response.json();
                console.log(`📂 Znaleziono folder: "${folderName}"`);

                images = data
                    .filter(file => file.download_url && /\.(jpg|jpeg|webp)$/i.test(file.name))
                    .map(file => file.download_url)
                    .slice(0, 10); // Maksymalnie 10 zdjęć

                if (images.length > 0) {
                    console.log(`✅ Zdjęcia dla "${name}":`, images);
                    break; // Znaleziono pasujący folder, nie szukamy dalej
                }
            }
        } catch (error) {
            console.warn(`⚠️ Błąd pobierania z folderu: "${folderName}"`, error);
        }
    }

    if (images.length === 0) {
        console.warn(`⚠️ Brak zdjęć dla "${name}" w żadnym z folderów.`);
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

        // 🔹 Obsługa powiększenia zdjęcia
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

    return {
        sliderHTML: `
            <div class="swiper-container ${sliderId}" style="width:100%; height: 150px; position: relative; overflow: hidden;">
                <div class="swiper-wrapper">
                    ${images.map(img => `
                        <div class="swiper-slide">
                            <img src="${img}" class="zoomable-image" style="width:100%; height:150px; object-fit:cover; border-radius:8px; cursor:pointer;">
                        </div>
                    `).join("")}
                </div>
                <div class="swiper-pagination"></div>

                <!-- 🔹 Nowe Mniejsze i Estetyczne Strzałki -->
                <div id="${prevBtnId}" class="custom-swiper-prev">
                    ❮
                </div>
                <div id="${nextBtnId}" class="custom-swiper-next">
                    ❯
                </div>
            </div>
        `,
        images
    };
}


// 🔹 Funkcja do powiększania zdjęcia i zmiany
// 🔹 Funkcja do powiększania zdjęcia i zmiany za pomocą strzałek
// 🔹 Funkcja do powiększania zdjęcia i zmiany za pomocą strzałek
function openFullscreen(images, index) {
    // Upewniamy się, że nie tworzymy wielu pełnoekranowych widoków
    let existingFullscreen = document.getElementById("fullscreen-view");
    if (existingFullscreen) {
        existingFullscreen.remove(); // Usunięcie starego widoku przed utworzeniem nowego
    }

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
    img.style.cursor = "pointer";

    // 🔹 Strzałka do poprzedniego zdjęcia
    const prevArrow = document.createElement("div");
    prevArrow.innerHTML = "❮";
    prevArrow.style.position = "absolute";
    prevArrow.style.left = "20px";
    prevArrow.style.top = "50%";
    prevArrow.style.transform = "translateY(-50%)";
    prevArrow.style.fontSize = "30px";
    prevArrow.style.color = "white";
    prevArrow.style.cursor = "pointer";
    prevArrow.style.zIndex = "10000";
    prevArrow.style.background = "rgba(0,0,0,0.5)";
    prevArrow.style.padding = "10px";
    prevArrow.style.borderRadius = "50%";

    prevArrow.addEventListener("click", (event) => {
        event.stopPropagation(); // Zapobiega zamknięciu pełnego ekranu na kliknięcie strzałki
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        img.src = images[currentIndex];
    });

    // 🔹 Strzałka do następnego zdjęcia
    const nextArrow = document.createElement("div");
    nextArrow.innerHTML = "❯";
    nextArrow.style.position = "absolute";
    nextArrow.style.right = "20px";
    nextArrow.style.top = "50%";
    nextArrow.style.transform = "translateY(-50%)";
    nextArrow.style.fontSize = "30px";
    nextArrow.style.color = "white";
    nextArrow.style.cursor = "pointer";
    nextArrow.style.zIndex = "10000";
    nextArrow.style.background = "rgba(0,0,0,0.5)";
    nextArrow.style.padding = "10px";
    nextArrow.style.borderRadius = "50%";

    nextArrow.addEventListener("click", (event) => {
        event.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        img.src = images[currentIndex];
    });

    // 🔹 Zamknięcie na kliknięcie poza obraz
    fullscreenContainer.addEventListener("click", () => {
        let existingFullscreen = document.getElementById("fullscreen-view");
        if (existingFullscreen && document.body.contains(existingFullscreen)) {
            document.body.removeChild(existingFullscreen);
        }
    });

    // 🔹 Obsługa klawiatury (strzałki + Escape)
    const keyHandler = (event) => {
        if (event.key === "ArrowRight") {
            currentIndex = (currentIndex + 1) % images.length;
            img.src = images[currentIndex];
        } else if (event.key === "ArrowLeft") {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            img.src = images[currentIndex];
        } else if (event.key === "Escape") {
            let existingFullscreen = document.getElementById("fullscreen-view");
            if (existingFullscreen && document.body.contains(existingFullscreen)) {
                document.body.removeChild(existingFullscreen);
            }
            document.removeEventListener("keydown", keyHandler); // Usuwamy nasłuchiwanie po zamknięciu
        }
    };
    document.addEventListener("keydown", keyHandler);

    // 🔹 Obsługa gestów dotykowych (swipe)
    let touchStartX = 0;
    let touchEndX = 0;

    img.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    img.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            currentIndex = (currentIndex + 1) % images.length; // Swipe left
        } else if (touchEndX - touchStartX > 50) {
            currentIndex = (currentIndex - 1 + images.length) % images.length; // Swipe right
        }
        img.src = images[currentIndex];
    });

    fullscreenContainer.appendChild(prevArrow);
    fullscreenContainer.appendChild(img);
    fullscreenContainer.appendChild(nextArrow);
    document.body.appendChild(fullscreenContainer);

    console.log("✅ Powiększenie zdjęcia otwarte:", images[currentIndex]);
}

// 🔹 Nasłuchiwanie otwarcia popupu i dodawanie zdjęć
map.on("popupopen", async function (e) {
    const popup = e.popup._contentNode;
    const nameElement = popup.querySelector("div");
    if (!nameElement) return;

    const name = nameElement.textContent.trim();
    const { sliderHTML, images } = await generateImageSlider(name);

    if (sliderHTML) {
        popup.insertAdjacentHTML("afterbegin", sliderHTML);
        initializeSwiper(name, images);
    }
});
