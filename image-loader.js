setTimeout(() => {
    if (typeof map === "undefined") {
        console.error("❌ Zmienna 'map' nie została zainicjalizowana przed użyciem.");
    } else {
        console.log("✅ Mapa poprawnie załadowana.");
    }
}, 1000);
// 🔹 Normalizacja nazw dla CSS i ID HTML
function sanitizeName(name) {
    return name
        .trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Usunięcie polskich znaków
        .replace(/&/g, "and") // Zamiana `&` na "and"
        .replace(/[–—]/g, "-") // Zamiana długiego i krótkiego myślnika na zwykły "-"
        .replace(/[_\s,./]+/g, "-") // Zamiana `_`, spacji, `,`, `.`, `/` na "-"
        .replace(/[^a-zA-Z0-9-]/g, "") // Usunięcie pozostałych znaków specjalnych
        .replace(/-+/g, "-") // Usunięcie wielokrotnych myślników
        .toLowerCase(); // Zamiana na małe litery
}

// 🔹 Pobieranie zdjęć z GitHuba
async function getLocationImages(name) {
    const cacheKey = `images_${name}`;
    const cacheTimeKey = `cache_time_${name}`;

    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);
    const now = Date.now();

    if (cachedData && cacheTime && now - cacheTime < 15 * 60 * 1000) {
        console.log(`📂 📥 Ładowanie zdjęć z cache: ${name}`);
        return JSON.parse(cachedData);
    }

    const githubRepo = "https://api.github.com/repos/campteamdev/Stronga-g/contents/";

    // 🔹 Pobranie listy folderów z repozytorium
    let folders = [];
    try {
        const repoResponse = await fetch(githubRepo);
        if (!repoResponse.ok) {
            console.error("❌ Błąd pobierania folderów z GitHuba:", repoResponse.statusText);
            return [];
        }
        folders = await repoResponse.json();
        folders = folders.filter(item => item.type === "dir").map(item => item.name);
        console.log("📂 ✅ Lista folderów w repozytorium:", folders);
    } catch (error) {
        console.error("❌ Błąd pobierania folderów:", error);
        return [];
    }

    // 🔹 Funkcja normalizująca nazwę folderu do porównywania
    function normalizeName(str) {
        return str
            .trim() // Usunięcie spacji na początku i końcu
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Usunięcie polskich znaków
            .replace(/[–-]+/g, " ") // Zamiana długiego i krótkiego myślnika na spację
            .replace(/_/g, " ") // Zamiana podkreślenia `_` na spację
            .replace(/\s+/g, " ") // Usunięcie podwójnych spacji
            .toLowerCase(); // Zamiana na małe litery
    }

    const baseName = normalizeName(name);

    // 🔹 Znalezienie najlepszego dopasowania folderu w repozytorium
    let matchedFolder = folders.find(folder => normalizeName(folder) === baseName);

    if (!matchedFolder) {
        console.warn(`⚠️ Folder dla "${name}" nie znaleziony.`);
        return [];
    }

    console.log(`📂 🔍 Używam folderu: "${matchedFolder}"`);

    let images = [];

    try {
        const response = await fetch(`${githubRepo}${encodeURIComponent(matchedFolder)}`);
        if (!response.ok) {
            console.warn(`⚠️ Folder "${matchedFolder}" nie został znaleziony.`);
            return [];
        }

        const data = await response.json();
        images = data
            .filter(file => file.download_url && /\.(jpg|jpeg|webp)$/i.test(file.name))
            .map(file => file.download_url)
            .slice(0, 10);

        if (images.length > 0) {
            console.log(`✅ Zdjęcia dla "${name}":`, images);
            localStorage.setItem(cacheKey, JSON.stringify(images));
            localStorage.setItem(cacheTimeKey, Date.now());
        } else {
            console.warn(`⚠️ Brak zdjęć w folderze "${matchedFolder}".`);
        }
    } catch (error) {
        console.error(`❌ Błąd pobierania zdjęć z folderu "${matchedFolder}":`, error);
    }

    return images;
}


// 🔹 Funkcja inicjalizująca Swiper
function initializeSwiper(name, images) {
    const safeName = sanitizeName(name);
const sliderId = `.swiper-container-${safeName}`;
const prevBtnId = `#swiper-prev-${safeName}`;
const nextBtnId = `#swiper-next-${safeName}`;

    
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

async function generateImageSlider(name) {
    const images = await getLocationImages(name);
    if (images.length === 0) return "";

    console.log(`✅ Generowanie slidera dla: ${name} (${images.length} zdjęć)`);

    // Użycie funkcji normalizeName do bezpiecznych identyfikatorów HTML/CSS
    const safeName = sanitizeName(name);
    const sliderId = `swiper-container-${safeName}`;
    const prevBtnId = `swiper-prev-${safeName}`;
    const nextBtnId = `swiper-next-${safeName}`;

    const sliderHTML = `
        <div class="swiper-container ${sliderId}" style="width:100%; height: 150px; position: relative; overflow: hidden;">
            <div class="swiper-wrapper">
                ${images.map(img => `
                    <div class="swiper-slide">
                        <img src="${img}" class="zoomable-image" style="width:100%; height:150px; object-fit:cover; border-radius:8px; cursor:pointer;">
                    </div>
                `).join("")}
            </div>
            <div class="swiper-pagination"></div>
            <div id="${prevBtnId}" class="custom-swiper-prev">❮</div>
            <div id="${nextBtnId}" class="custom-swiper-next">❯</div>
        </div>
    `;

    console.log(`📂 ✅ Wygenerowany kod HTML dla ${name}:`, sliderHTML);
    
    return { sliderHTML, images };
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
    setTimeout(async () => {
        const popup = e.popup._contentNode;
        const nameElement = popup.querySelector("div");
        if (!nameElement) return;

        const name = nameElement.textContent.trim();
        console.log(`📂 🔍 Otwieranie popupu dla: ${name}`);

        const { sliderHTML, images } = await generateImageSlider(name);

        if (sliderHTML) {
            popup.insertAdjacentHTML("afterbegin", sliderHTML);
            console.log(`📂 ✅ HTML slidera dodany do popupu dla: ${name}`);

            // Wymuszenie sprawdzenia obecności slidera
            setTimeout(() => {
                const safeSliderId = `swiper-container-${name
                    .trim()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Usunięcie polskich znaków
                    .replace(/[–—]/g, "-") // Zamiana długiego myślnika na zwykły myślnik
                    .replace(/[\s_]+/g, "-") // Zamiana spacji i podkreśleń na myślnik
                    .replace(/[^a-zA-Z0-9-]/g, "") // Usunięcie innych znaków specjalnych
                    .toLowerCase()}`;
                
                console.log(`📂 📌 Sprawdzam obecność slidera:`, document.querySelector(`.${safeSliderId}`));
                
            }, 500);

            initializeSwiper(name, images);
        }
    }, 300); // Drobne opóźnienie na wygenerowanie popupu
});

