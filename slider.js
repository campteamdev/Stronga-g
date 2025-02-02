// Zapobieganie wielokrotnemu ładowaniu skryptu
if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// Pobranie zdjęć z `images.json`
async function fetchImages(name) {
    try {
        console.log(`📥 Pobieranie images.json dla: ${name}`);
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error(`❌ Błąd pobierania images.json: ${response.status}`);

        const data = await response.json();
        
        // Usunięcie polskich znaków i formatowanie
        const formattedName = name
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_"); // Zamiana spacji na `_`

        console.log(`🔍 Wyszukiwanie zdjęć dla: ${formattedName}`);
        return data[name] || data[formattedName] || []; // Wyszukujemy pod dwiema wersjami nazwy
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Tworzenie i wyświetlanie slidera w popupie
async function showSlider(name) {
    console.log("🔍 Pobieram zdjęcia dla:", name);
    
    const validImages = await fetchImages(name);
    
    if (validImages.length === 0) {
        console.warn(`🚫 Brak zdjęć dla: ${name}`);
        return;
    }

    let popupContent = document.querySelector(".leaflet-popup-content");
    if (!popupContent) {
        console.warn("⚠️ Popup nie znaleziony, nie można dodać slidera!");
        return;
    }

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
              <img src="${img}" style="width:100%; height:100%; object-fit:cover; border-radius: 10px;">
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
        console.log(`🚀 Slider dla "${name}" załadowany!`);
    }, 300);
}

// Obsługa kliknięcia w popup, aby wywołać slider
document.body.addEventListener("click", async function (event) {
    let popup = event.target.closest(".leaflet-popup-content");
    if (popup) {
        let popupTitle = popup.querySelector("div strong");
        if (popupTitle) {
            let campName = popupTitle.textContent.trim();
            console.log(`🟢 Kliknięto na marker: ${campName}`);
            await showSlider(campName);
        } else {
            console.warn("⚠️ Brak nazwy kempingu w popupie!");
        }
    }
});
