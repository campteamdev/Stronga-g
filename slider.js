// Zapobieganie wielokrotnemu ładowaniu skryptu
if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// **Pobieranie zdjęć z `images.json` tylko dla Górska Sadyba**
async function fetchImages(name) {
    try {
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error('❌ Nie udało się pobrać images.json');

        const data = await response.json();
        console.log("📂 Załadowano images.json:", data);

        // **Formatowanie nazwy kempingu**
        const formattedName = name
            .trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");

        console.log("🔎 Sprawdzam klucze:", name, formattedName);

        // **Zwracamy tylko jeśli Górska Sadyba istnieje w bazie**
        return data[name] || data[formattedName] || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

// **Funkcja dodająca slider do popupu (tylko dla Górska Sadyba)**
async function addSliderToPopup(name, popupContent) {
    console.log("🔍 Sprawdzam, czy dodać slider dla:", name);

    const validImages = await fetchImages(name);

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
      <div class="swiper-container" style="width:100%; height:200px; margin-bottom: 10px;">
        <div class="swiper-wrapper">
          ${validImages.map(img => `
            <div class="swiper-slide">
              <img src="${img}" class="slider-img" style="width:100%; height:100%; object-fit:cover; border-radius: 10px;">
            </div>
          `).join("")}
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
      </div>
    `;

    let sliderContainer = document.createElement("div");
    sliderContainer.innerHTML = sliderHTML;
    popupContent.prepend(sliderContainer);

    console.log("🚀 Slider dodany do popupu!");

    setTimeout(() => {
        new Swiper('.swiper-container', {
            loop: true,
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

// **Obsługa otwierania popupów**
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
        
        // **Dodaj slider tylko dla Górska Sadyba**
        if (campName === "Górska Sadyba") {
            await addSliderToPopup(campName, popupContent);
        } else {
            console.warn(`⚠️ ${campName} nie ma zdjęć w images.json - pomijam slider`);
        }
    } else {
        console.warn("⚠️ Brak nazwy kempingu w popupie!");
    }
});
