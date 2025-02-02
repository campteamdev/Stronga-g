// Zapobieganie wielokrotnemu ładowaniu skryptu
if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// **TESTOWE zdjęcia dla każdej lokalizacji**
const testImages = [
    "/foty/Gorska_Sadyba_1.jpeg",
    "/foty/Gorska_Sadyba_2.jpg"
];

// **Tworzenie i wyświetlanie slidera w popupie**
async function showSlider(name) {
    console.log("🔍 Wywołano slider dla:", name);

    // **ZAMIENIAMY POBIERANIE Z images.json NA TESTOWE**
    const validImages = testImages;
    
    if (validImages.length === 0) {
        console.warn("🚫 Brak zdjęć (TESTOWE)", name);
        return;
    }

    let popupContent = document.querySelector(".leaflet-popup-content");
    if (!popupContent) return;

    let existingSlider = popupContent.querySelector(".swiper-container");
    if (existingSlider) {
        console.log("⚠️ Slider już istnieje w popupie.");
        return;
    }

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

    setTimeout(() => {
        new Swiper('.swiper-container', {
            loop: true,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
    }, 100);

    console.log("🚀 Slider dodany!");

    // **Obsługa błędów ładowania obrazów**
    document.querySelectorAll('.slider-img').forEach(img => {
        img.onerror = function () {
            console.error(`❌ Błąd ładowania zdjęcia: ${this.src}`);
            this.src = "/foty/default.jpg"; // Fallback na zdjęcie zastępcze
        };
    });
}

// **Obsługa kliknięcia w popup, aby wywołać slider**
document.body.addEventListener("click", async function (event) {
    let popup = event.target.closest(".leaflet-popup-content");
    if (popup) {
        let popupTitle = popup.querySelector("div strong");
        if (popupTitle) {
            let campName = popupTitle.textContent.trim();
            console.log("🟢 Kliknięto na marker:", campName);
            await showSlider(campName);
        } else {
            console.warn("⚠️ Brak nazwy kempingu w popupie!");
        }
    }
});
