// Zapobieganie wielokrotnemu ładowaniu skryptu
if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// 🟢 Funkcja do dodania slidera do popupu
async function addSliderToPopup(name, popupElement) {
    console.log("🔍 Tworzę slider w popupie dla: ", name);

    // **Testowe zdjęcia - zamiast obrazków dajemy napisy**
    const testImages = [
        `SLIDER: ${name} (1)`,
        `SLIDER: ${name} (2)`,
        `SLIDER: ${name} (3)`
    ];

    // 🔹 **Tworzymy slider wewnątrz popupu**
    let sliderHTML = `
      <div class="swiper-container" style="width:100%; height:150px; text-align:center;">
        <div class="swiper-wrapper">
          ${testImages.map(txt => `
            <div class="swiper-slide" style="display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:bold; color:white; background:black;">
              ${txt}
            </div>
          `).join("")}
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
      </div>
    `;

    // **Dodajemy slider do popupu**
    popupElement.insertAdjacentHTML("beforeend", sliderHTML);

    // **Inicjalizacja Swiper.js**
    setTimeout(() => {
        new Swiper('.swiper-container', {
            loop: true,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
    }, 200);

    console.log("🚀 Slider dodany do popupu!");
}

// 🟢 **Event otwierania popupu – wstawiamy slider do popupu**
map.on("popupopen", function (e) {
    let popupElement = e.popup._contentNode;
    let popupTitle = popupElement.querySelector("strong");

    if (popupTitle) {
        let campName = popupTitle.textContent.trim();
        console.log("🟢 Otworzono popup dla: ", campName);
        addSliderToPopup(campName, popupElement);
    } else {
        console.warn("⚠️ Brak nazwy w popupie!");
    }
});
