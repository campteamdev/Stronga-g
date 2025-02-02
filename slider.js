// Zapobieganie wielokrotnemu ładowaniu skryptu
if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// Pobranie danych z images.json
let imagesData = {};

async function loadImagesData() {
    try {
        const response = await fetch("/images.json");
        if (!response.ok) throw new Error("Błąd pobierania images.json");
        imagesData = await response.json();
        console.log("📂 Załadowano images.json:", imagesData);
    } catch (error) {
        console.error("❌ Błąd ładowania images.json:", error);
    }
}

// Funkcja do uruchomienia slidera
async function showSlider(name) {
    console.log("🔍 Sprawdzam nazwę miejsca:", name);
    console.log("📂 Lista dostępnych miejsc:", Object.keys(imagesData));

    // Dopasowanie nazwy (uwzględnia różne wielkości liter)
    const matchingKey = Object.keys(imagesData).find(key => 
        key.toLowerCase() === name.toLowerCase()
    );

    let images = matchingKey ? imagesData[matchingKey] : [];

    console.log("📷 Liczba znalezionych zdjęć:", images.length);

    // Jeśli brak zdjęć, dodajemy placeholder
    if (images.length === 0) {
        images = ["/foty/placeholder.jpg"]; // Możesz dodać własny placeholder
    }

    // Tworzymy kontener slidera, jeśli nie istnieje
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
          ${images.map(img => `
            <div class="swiper-slide" style="display:flex; align-items:center; justify-content:center; background:#ddd;">
              ${img.includes("placeholder") ? `<p style="font-size:18px; font-weight:bold;">Brak zdjęcia dla ${name}</p>` : `<img src="${img}" style="width:100%; height:100%; object-fit:cover;">`}
            </div>
          `).join("")}
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
        <button id="close-slider" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; padding:5px; cursor:pointer;">✖</button>
      </div>
    `;

    console.log("✅ Generuję slider...");

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

    console.log("🚀 Slider pokazany!");

    // Obsługa zamykania slidera
    setTimeout(() => {
        let closeBtn = document.getElementById("close-slider");
        if (closeBtn) {
            closeBtn.onclick = () => {
                sliderContainer.style.display = "none";
            };
        }
    }, 300);
}

// Obsługa kliknięcia na popup
document.body.addEventListener("click", async function (event) {
    let popup = event.target.closest(".leaflet-popup-content");
    if (popup) {
        let popupTitle = popup.querySelector("div strong");
        if (popupTitle) {
            let campName = popupTitle.textContent.trim();
            console.log("🟢 Kliknięto na marker: ", campName);
            await showSlider(campName);
        } else {
            console.warn("⚠️ Brak nazwy kempingu w popupie!");
        }
    }
});

// Załaduj dane o zdjęciach na początku
loadImagesData();
