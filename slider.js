// Zapobieganie wielokrotnemu ładowaniu skryptu
if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// 📂 Pobranie zdjęć z `images.json`
async function fetchImages(name) {
    try {
        alert(`🔍 Pobieram zdjęcia dla: ${name}`);
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error('❌ Nie udało się pobrać images.json');

        const data = await response.json();
        const formattedName = name.trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Usuwa polskie znaki
            .toLowerCase(); // Zamienia na małe litery

        alert(`📌 Nazwa po normalizacji: ${formattedName}`);
        alert(`📌 Klucze w images.json: ${Object.keys(data).join(", ")}`);

        // Szukamy w pliku images.json różnych wersji nazwy
        let images = data[formattedName] || data[name] || data[name.toLowerCase()] || [];
        
        if (images.length === 0) {
            alert(`🚫 Brak zdjęć dla: ${name} | Spróbuj dodać: "${formattedName}" do images.json`);
        }

        return images;
    } catch (error) {
        alert("⚠️ Błąd pobierania images.json!");
        console.error(error);
        return [];
    }
}

// 📸 Tworzenie i wyświetlanie slidera w popupie
async function showSlider(name) {
    console.log("🔍 Pobieram zdjęcia dla:", name);

    const validImages = await fetchImages(name);

    if (validImages.length === 0) {
        console.warn("🚫 Brak zdjęć dla:", name);
        return;
    }

    let popupContent = document.querySelector(".leaflet-popup-content");
    if (!popupContent) {
        alert("❌ Brak znalezionego popupu!");
        return;
    }

    let existingSlider = popupContent.querySelector(".swiper-container");
    if (existingSlider) {
        console.log("⚠️ Slider już istnieje w popupie.");
        return;
    }

    let sliderHTML = `
      <div class="swiper-container" style="width:100%; height:200px; margin-bottom: 10px; border-radius: 10px; overflow: hidden;">
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
    }, 100);

    console.log("🚀 Slider dodany do popupu!");
}

// 📍 Obsługa kliknięcia w popup, aby wywołać slider
document.body.addEventListener("click", async function (event) {
    let popup = event.target.closest(".leaflet-popup-content");

    if (popup) {
        alert("📌 Kliknięto w popup!");

        let popupTitle = popup.querySelector("div strong");
        if (popupTitle) {
            let campName = popupTitle.textContent.trim();
            alert(`🟢 Nazwa kempingu: ${campName}`);
            await showSlider(campName);
        } else {
            alert("⚠️ Brak nazwy kempingu w popupie!");
        }
    }
});
