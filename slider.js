if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// 📌 Obsługa kliknięcia w popup
document.body.addEventListener("click", async function(event) {
    let popup = event.target.closest(".leaflet-popup-content");

    if (popup) {
        alert("📌 Kliknięto w popup!");

        let popupTextLines = popup.innerText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        
        if (popupTextLines.length > 0) {
            let campName = popupTextLines[0]; // Pierwsza linia to nazwa kempingu
            alert(`🟢 Nazwa kempingu: ${campName}`);
            await showSlider(campName);
        } else {
            alert("⚠️ Brak poprawnej nazwy kempingu w popupie!");
        }
    }
});

// 📌 Pobranie zdjęć z `images.json`
async function fetchImages(name) {
    try {
        alert(`🔍 Pobieram zdjęcia dla: ${name}`);
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error('❌ Nie udało się pobrać images.json');

        const data = await response.json();
        const formattedName = name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        alert(`📂 Szukam zdjęć dla: ${formattedName}`);

        return data[formattedName] || []; // Zwracamy tablicę zdjęć lub pustą tablicę
    } catch (error) {
        alert("⚠️ Błąd pobierania images.json!");
        console.error(error);
        return [];
    }
}

// 📌 Tworzenie i wyświetlanie slidera w popupie
async function showSlider(name) {
    const validImages = await fetchImages(name);

    if (validImages.length === 0) {
        alert("🚫 Brak zdjęć dla: " + name);
        return;
    }

    let popupContent = document.querySelector(".leaflet-popup-content");
    if (!popupContent) {
        alert("⚠️ Nie znaleziono popupContent!");
        return;
    }

    let existingSlider = popupContent.querySelector(".swiper-container");
    if (existingSlider) {
        alert("⚠️ Slider już istnieje w popupie!");
        return;
    }

    alert("📸 Tworzę slider dla " + name);

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

    alert("🚀 Dodano slider, inicjalizuję Swiper!");

    setTimeout(() => {
        new Swiper('.swiper-container', {
            loop: true,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
        alert("✅ Swiper.js został uruchomiony!");
    }, 100);
}
