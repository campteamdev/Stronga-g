// Funkcja sprawdzająca, czy zdjęcie istnieje
async function checkImageExists(url) {
    return new Promise((resolve) => {
        let img = new Image();
        img.src = url;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
    });
}

// Funkcja do tworzenia slidera nad popupem
async function showSlider(name) {
    // Formatowanie nazwy do użycia w ścieżkach zdjęć
    const formattedName = name.replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const images = [
        `/foty/${formattedName}_1.jpg`,
        `/foty/${formattedName}_2.jpg`,
        `/foty/${formattedName}_3.jpg`
    ];

    // Sprawdzamy, które zdjęcia faktycznie istnieją
    let validImages = [];
    for (let img of images) {
        if (await checkImageExists(img)) {
            validImages.push(img);
        }
    }

    // Jeśli nie ma żadnych zdjęć, nie pokazujemy slidera
    if (validImages.length === 0) {
        return;
    }

    // Sprawdzamy, czy slider już istnieje, jeśli nie - tworzymy go
    let sliderContainer = document.getElementById("campteam-slider");
    if (!sliderContainer) {
        sliderContainer = document.createElement("div");
        sliderContainer.id = "campteam-slider";
        sliderContainer.style.position = "fixed";
        sliderContainer.style.top = "10px";
        sliderContainer.style.left = "50%";
        sliderContainer.style.transform = "translateX(-50%)";
        sliderContainer.style.width = "300px";
        sliderContainer.style.height = "200px";
        sliderContainer.style.zIndex = "1000";
        sliderContainer.style.background = "#fff";
        sliderContainer.style.boxShadow = "0px 4px 6px rgba(0,0,0,0.2)";
        sliderContainer.style.borderRadius = "10px";
        sliderContainer.style.padding = "10px";
        sliderContainer.style.display = "none";
        document.body.appendChild(sliderContainer);
    }

    // Generujemy zawartość slidera
    let sliderHTML = `
      <div class="swiper-container" style="width:100%; height:100%;">
        <div class="swiper-wrapper">
          ${validImages.map(img => `
            <div class="swiper-slide">
              <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
            </div>
          `).join("")}
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
        <button id="close-slider" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; padding:5px; cursor:pointer;">✖</button>
      </div>
    `;

    // Dodajemy zawartość do kontenera
    sliderContainer.innerHTML = sliderHTML;
    sliderContainer.style.display = "block";

    // Inicjalizacja Swiper.js
    setTimeout(() => {
        new Swiper('.swiper-container', {
            loop: true,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
    }, 200);

    // Obsługa zamykania slidera
    document.getElementById("close-slider").addEventListener("click", () => {
        sliderContainer.style.display = "none";
    });
}

// Obsługa kliknięcia na popup
document.body.addEventListener("click", async function (event) {
    if (event.target.closest(".leaflet-popup-content")) {
        let popup = event.target.closest(".leaflet-popup-content");
        let popupTitle = popup.querySelector("div strong");
        if (popupTitle) {
            await showSlider(popupTitle.textContent.trim());
        }
    }
});
