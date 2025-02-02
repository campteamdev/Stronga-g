// Zapobieganie wielokrotnemu ładowaniu skryptu
if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// TESTOWE zdjęcia dla każdej lokalizacji (dla sprawdzenia działania)
const testImages = [
    "/foty/Gorska_Sadyba_1.jpeg",
    "/foty/Gorska_Sadyba_2.jpg"
];

// **Funkcja dodająca slider do popupu (automatycznie po otwarciu)**
async function addSliderToPopup(name, popupContent) {
    console.log("🔍 Dodaję slider do popupu:", name);

    // **Wymuszamy testowe zdjęcia dla każdej lokalizacji**
    const validImages = testImages;
    
    if (validImages.length === 0) {
        console.warn("🚫 Brak zdjęć (TESTOWE)", name);
        return;
    }

    let existingSlider = popupContent.querySelector(".swiper-container");
    if (existingSlider) {
        console.log("⚠️ Slider już istnieje w popupie.");
        return;
    }

    console.log("🛠️ Tworzenie slidera...");
    
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

// **Nowa obsługa otwierania popupów**
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
        await addSliderToPopup(campName, popupContent);
    } else {
        console.warn("⚠️ Brak nazwy kempingu w popupie!");
    }
});
