// Zapobieganie wielokrotnemu ładowaniu skryptu
if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

/async function fetchImages(name) {
    try {
        console.log("📡 Pobieram `images.json`...");
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error('❌ Nie udało się pobrać images.json');

        const data = await response.json();
        console.log("📂 Załadowano images.json:", data);

        // **Formatowanie nazwy**
        const formattedName = name
            .trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");

        console.log("🔎 Szukam zdjęć dla:", name, `(Formatowana: ${formattedName})`);

        let imageLinks = data[name] || data[formattedName] || [];

        // 🔹 Zamiana API GitHub na raw.githubusercontent.com
        imageLinks = imageLinks.map(img => img.replace(
            'https://api.github.com/repos/campteamdev/Stronga-g/contents/',
            'https://raw.githubusercontent.com/campteamdev/Stronga-g/main/'
        ).split('?')[0]);

        console.log("✅ Ostateczne linki do zdjęć:", imageLinks);

        return imageLinks;
    } catch (error) {
        console.error(error);
        return [];
    }
}


async function addSliderToPopup(name, popupContent) {
    console.log("🔍 Sprawdzam, czy dodać slider dla:", name);

    const validImages = await fetchImages(name);

    // **Dodanie zdjęcia z przyciskiem "+" na końcu**
    const addPhotoButton = `
        <div class="swiper-slide add-photo-slide">
            <a href="https://www.campteam.pl/dodaj/dodaj-zdj%C4%99cie-lub-opini%C4%99" target="_blank" class="add-photo-link">
                <div class="add-photo-circle">+</div>
            </a>
        </div>`;

    if (validImages.length === 0) {
        console.warn(`🚫 Brak zdjęć dla: ${name} - Slider nie zostanie dodany`);
        return;
    }

    let existingSlider = popupContent.querySelector(".swiper-container");
    if (existingSlider) {
        console.log("⚠️ Slider już istnieje w popupie.");
        return;
    }

    console.log("🛠️ Tworzenie slidera dla:", name);

    let sliderHTML = `
        <div class="swiper-container" style="width:100%; height:200px; margin-top: 50px; margin-bottom: 10px;">
            <div class="swiper-wrapper">
                ${validImages.map(img => `
                    <div class="swiper-slide">
                        <img src="${img}" class="slider-img" style="width:100%; height:100%; object-fit:cover; border-radius: 10px;">
                    </div>
                `).join("")}
                ${addPhotoButton} <!-- 🔹 Dodanie kółka z plusem na końcu -->
            </div>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
        </div>`;

    let sliderContainer = document.createElement("div");
    sliderContainer.innerHTML = sliderHTML;
    popupContent.prepend(sliderContainer);

    console.log("🚀 Slider dodany do popupu!");

    setTimeout(() => {
        new Swiper('.swiper-container', {
            loop: false, // 🔹 Wyłączamy zapętlenie, żeby "+" było zawsze na końcu
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
        console.log("✅ Swiper zainicjalizowany!");
    }, 100);

    // **Obsługa błędów ładowania obrazów**
    document.querySelectorAll('.slider-img').forEach(img => {
        img.onerror = function () {
            console.error(`❌ Błąd ładowania zdjęcia: ${this.src}`);
            this.src = "https://via.placeholder.com/300x200?text=Brak+zdjęcia"; // Zdjęcie zastępcze
        };
    });
}



// **Dodawanie slidera już w momencie generowania popupu**
async function modifyPopupContent(name, popupContent) {
    console.log("🛠️ Modyfikuję treść popupu dla:", name);
    await addSliderToPopup(name, popupContent);
}

// **Modyfikacja popupu natychmiast po jego wygenerowaniu**
map.on("popupopen", async function (e) {
    let popupContent = e.popup._contentNode;

    if (!popupContent) {
        console.error("❌ Brak `.leaflet-popup-content` - popup się nie wyświetlił?");
        return;
    }

    let popupTitle = popupContent.querySelector("div strong");
    if (popupTitle) {
        let campName = popupTitle.textContent.trim();
        console.log("🟢 Otworzono popup dla:", campName);

        // **Od razu dodaj slider do popupu**
        await modifyPopupContent(campName, popupContent);
    } else {
        console.warn("⚠️ Brak nazwy kempingu w popupie!");
    }
});
