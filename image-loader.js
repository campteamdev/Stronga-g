// ✅ Zabezpieczenie przed błędem `phoneNumbersMap is not defined`
if (typeof phoneNumbersMap === "undefined") {
    var phoneNumbersMap = {};  // Pusta mapa numerów, jeśli nie istnieje
}




const CACHE_DURATION_FOLDERS = 60 * 60 * 1000; // 1 godzina
const GITHUB_REPO = "https://api.github.com/repos/campteamdev/Stronga-g/contents/";

// ✅ FUNKCJA NORMALIZUJĄCA NAZWY
function sanitizeName(name) {
    return name
        .trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "and")
        .replace(/[–—]/g, "-")
        .replace(/[_\s,./]+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .replace(/-+/g, "-")
        .toLowerCase();
}

// ✅ POBIERANIE FOLDERÓW Z GITHUBA
async function getGitHubFolders() {
    const cacheKey = "github_folders";
    const cacheTimeKey = "github_folders_time";
    const now = Date.now();

    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cacheTime && now - parseInt(cacheTime) < CACHE_DURATION_FOLDERS) {
       
        return JSON.parse(cachedData);
    }

    try {
        const response = await fetch(GITHUB_REPO);
        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
   

        const folders = data
            .filter(item => item.type === "dir")
            .map(item => item.name);
        
        
        

        // ✅ Zapisujemy do cache
        localStorage.setItem(cacheKey, JSON.stringify(folders));
        localStorage.setItem(cacheTimeKey, now);

      
        return folders;
    } catch (error) {

        return [];
    }
}

// ✅ POBIERANIE OBRAZÓW
// ✅ Funkcja pobierająca zdjęcia z priorytetem dla pierwszego zdjęcia

async function getLocationImages(name) {
    const cacheKey = `images_${name}`;
    const cacheTimeKey = `cache_time_${name}`;
    const now = Date.now();

    // ✅ Sprawdzenie cache dla zdjęć (15 min)
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);
    if (cachedData && cacheTime && now - parseInt(cacheTime) < 60 * 60 * 1000) {

        return JSON.parse(cachedData);
    }

    // ✅ Pobranie listy folderów z GitHuba
    const folders = await getGitHubFolders();
    if (folders.length === 0) {
        console.warn("⚠️ Brak folderów w repozytorium!");
        return [];
    }

    function normalizeForMatching(str) {
        return str
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // Usunięcie polskich znaków
            .replace(/[_\s,./-]+/g, " ")  // Zamiana separatorów na spacje
            .replace(/&/g, " and ")  // Zamiana `&` na `and`
            .replace(/[^a-z0-9 ]/g, "")  // Usunięcie wszystkich innych znaków
            .trim();  // Usunięcie zbędnych spacji
    }

    const normalizedName = normalizeForMatching(name);
    let bestMatch = null;
    let bestScore = 0;

    // 🔍 **Dopasowanie folderów do lokalizacji**
    folders.forEach(folder => {
        const normalizedFolder = normalizeForMatching(folder);

        // **Krok 1: Sprawdzenie 100% zgodności**
        if (normalizedFolder === normalizedName) {
            bestMatch = folder;
            bestScore = 100;
            return;
        }

        // **Krok 2: Fuzzy Matching (precyzyjne dopasowanie)**
        const fuzzScore = fuzzball.ratio(normalizedFolder, normalizedName);
        if (fuzzScore > bestScore && fuzzScore >= 90) {  // **Podwyższony próg na 90**
            bestMatch = folder;
            bestScore = fuzzScore;
        }
    });

    if (!bestMatch) {
        console.warn(`⚠️ Folder dla "${name}" nie znaleziony.`);
        return [];
    }



    // ✅ Pobieramy listę plików z folderu na GitHubie
    try {
        const response = await fetch(`${GITHUB_REPO}${encodeURIComponent(bestMatch)}`);
        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
     

        const allImages = data
            .filter(file => file.download_url && /\.(jpg|jpeg|webp)$/i.test(file.name))
            .map(file => file.download_url);

        if (allImages.length === 0) {
            console.warn(`⚠️ Brak zdjęć w folderze "${bestMatch}".`);
            return [];
        }


        // ✅ Zapisujemy do cache, aby przyspieszyć kolejne ładowania
        localStorage.setItem(cacheKey, JSON.stringify(allImages));
        localStorage.setItem(cacheTimeKey, now);

        return allImages;
    } catch (error) {
  

        // ❌ **Czyszczenie cache w razie błędu**
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheTimeKey);

        return [];
    }
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
            lazy: {
                loadPrevNext: true,  // Załaduj poprzedni i następny slajd
                loadOnTransitionStart: true // Ładuj zdjęcie od razu po zmianie slajdu
            },
            navigation: {
                nextEl: nextBtnId,
                prevEl: prevBtnId
            },
            on: {
                init: function () {
                
                    forceLazyLoad(sliderId);
                },
                slideChangeTransitionStart: function () {
                    forceLazyLoad(sliderId);
                }
            }
        });


        // 🔹 Obsługa powiększenia zdjęcia
        document.querySelectorAll(`${sliderId} .zoomable-image`).forEach((img, index) => {
            img.addEventListener("click", () => openFullscreen(images, index));
        });

    }, 500);
}

// ✅ Funkcja generująca slider + ikony
async function generateImageSlider(name, lat, lon, phoneNumber) {
    const images = await getLocationImages(name);
    const safeName = sanitizeName(name);
    const sliderId = `swiper-container-${safeName}`;
    const prevBtnId = `swiper-prev-${safeName}`;
    const nextBtnId = `swiper-next-${safeName}`;

    const phoneLink = phoneNumber && phoneNumber !== "" ? `tel:${phoneNumber}` : "#";
    const phoneCursor = phoneNumber && phoneNumber !== "" ? "pointer" : "not-allowed";
    const phoneOpacity = phoneNumber && phoneNumber !== "" ? "1" : "0.5";

    let sliderHTML = images.length > 0 ? `
        <div class="swiper-container ${sliderId}" style="width:100%; height: 140px; position: relative; overflow: hidden;">
            <div class="swiper-wrapper">
                ${images.map(img => `
                    <div class="swiper-slide">
                        <img data-src="${img}" class="zoomable-image swiper-lazy" 
                             style="width:100%; height:140px; object-fit:cover; 
                                    border-radius:8px; cursor:pointer;">
                        <div class="swiper-lazy-preloader"></div>
                    </div>
                `).join("")}
            </div>
            <div class="swiper-pagination"></div>
            <div id="${prevBtnId}" class="custom-swiper-prev">❮</div>
            <div id="${nextBtnId}" class="custom-swiper-next">❯</div>
        </div>` : ``;

    // ✅ Sekcja ikon (ikona telefonu + inne ikony)
    let iconsSection = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; 
                margin-top: 8px; width: 100%; max-width: 100%; flex-wrap: wrap;">
        <!-- 🔹 Ikona "Zadzwoń" -->
        <a href="${phoneLink}" 
           style="display: inline-block; width: 40px; height: 40px; opacity: ${phoneOpacity}; cursor: ${phoneCursor};">
            <img src="https://raw.githubusercontent.com/campteamdev/Stronga-g/main/ikony/zadzwon.webp" 
                 alt="Zadzwoń"
                 style="width: 40px; height: 40px;">
        </a>

        <!-- 🔹 Ikona "Dodaj zdjęcie" (OTWIERA FORMULARZ) -->
        <a href="#" class="open-photo-form" 
           data-location="${name}" 
           data-lat="${lat}" 
           data-lon="${lon}"
           style="display: inline-block; width: 40px; height: 40px;">
            <img src="https://raw.githubusercontent.com/campteamdev/Stronga-g/main/ikony/add%20photo.webp" 
                 alt="Dodaj zdjęcie"
                 class="pulsing-icon"
                 style="width: 40px; height: 40px;">
        </a>

     <!-- 🔹 Ikona "Opinia" (OTWIERA POPUP KOMENTARZY) -->
<a href="#" class="open-comments" 
   data-placeid="${name}" 
   style="display: inline-block; width: 40px; height: 40px;">
    <img src="https://raw.githubusercontent.com/campteamdev/Stronga-g/main/ikony/opinia.webp" 
         alt="Dodaj opinię"
         style="width: 40px; height: 40px;">
</a>

        <!-- 🔹 Ikona "Prowadź" -->
        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" 
           target="_blank"
           style="display: inline-block; width: 40px; height: 40px;">
            <img src="https://raw.githubusercontent.com/campteamdev/Stronga-g/main/ikony/prowadz.webp" 
                 alt="Prowadź"
                 style="width: 40px; height: 40px;">
        </a>
    </div>`;

    let finalHTML = sliderHTML + iconsSection;

    return { sliderHTML: finalHTML, images };
}

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


}

// 🔹 Nasłuchiwanie otwarcia popupu i dodawanie zdjęć
map.on("popupopen", async function (e) {
    setTimeout(async () => {
        const popup = e.popup._contentNode;
        const nameElement = popup.querySelector("div");
        if (!nameElement) return;

        const name = nameElement.textContent.trim();
        

        // Pobieramy współrzędne markera z popupu
        const lat = e.popup._source.getLatLng().lat;
        const lon = e.popup._source.getLatLng().lng;

        // ✅ Generujemy slider z poprawnym przekazaniem lat/lon
        const { sliderHTML, images } = await generateImageSlider(name, lat, lon);

        if (sliderHTML) {
            popup.insertAdjacentHTML("afterbegin", sliderHTML);


            // Sprawdzenie obecności slidera
            setTimeout(() => {
                const safeSliderId = `swiper-container-${sanitizeName(name)}`;
       
            }, 500);

            initializeSwiper(name, images);
        }
    }, 300); // Drobne opóźnienie na wygenerowanie popupu
});

function forceLazyLoad(sliderId) {
    document.querySelectorAll(`${sliderId} .swiper-slide img[data-src]`).forEach(img => {
        if (!img.src) {
            img.src = img.getAttribute("data-src");
        }
    });
}

