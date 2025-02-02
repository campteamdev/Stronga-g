if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

async function fetchImages(name) {
    try {
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error('❌ Nie udało się pobrać images.json');

        const data = await response.json();
        const formattedName = name
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");

        console.log(`📷 Szukam zdjęć dla: ${formattedName}`);
        return data[formattedName] || []; // Jeśli nie znajdzie zdjęć, zwraca pustą tablicę
    } catch (error) {
        console.error("❌ Błąd pobierania images.json:", error);
        return [];
    }
}

async function showSlider(name) {
    alert(`🔍 Sprawdzam slider dla: ${name}`); // Debugowanie

    const validImages = await fetchImages(name);

    if (validImages.length === 0) {
        alert(`🚫 Brak zdjęć dla: ${name}`); // Debugowanie
        return;
    }

    let popupContent = document.querySelector(".leaflet-popup-content");
    if (!popupContent) {
        alert("❌ Nie znaleziono popupu!");
        return;
    }

    let existingSlider = popupContent.querySelector(".swiper-container");
    if (existingSlider) {
        existingSlider.remove();
    }

    // **TESTOWY SLIDER** (zamiast zdjęć pokazuje napis!)
    let sliderHTML = `
      <div class="swiper-container" style="width:100%; height:200px; margin-bottom: 10px; background: lightgray; display: flex; justify-content: center; align-items: center;">
        <div class="swiper-wrapper">
          <div class="swiper-slide"><h3 style="text-align:center;">🚀 Slider dla ${name}</h3></div>
        </div>
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
    }, 200);
}

document.body.addEventListener("click", async function (event) {
    let popup = event.target.closest(".leaflet-popup-content");
    if (popup) {
        let popupTitle = popup.querySelector("div strong");
        if (popupTitle) {
            let campName = popupTitle.textContent.trim();
            alert(`🟢 Kliknięto na marker: ${campName}`); // Debugowanie
            await showSlider(campName);
        } else {
            alert("⚠️ Brak nazwy kempingu w popupie!");
        }
    }
});
