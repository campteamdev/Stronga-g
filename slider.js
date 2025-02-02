// Zapobieganie wielokrotnemu ładowaniu skryptu
if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// 🟢 Funkcja do tworzenia slidera
async function showSlider(name) {
    console.log("🔍 Uruchamiam slider dla: ", name);

    // Testowe dane - zamiast zdjęć dajemy napisy
    const testImages = [
        `SLIDER DLA: ${name} (1)`,
        `SLIDER DLA: ${name} (2)`,
        `SLIDER DLA: ${name} (3)`
    ];

    console.log("📷 Tworzę slider z testowymi obrazkami.");

    // Tworzymy kontener slidera, jeśli nie istnieje
    let sliderContainer = document.getElementById("campteam-slider");
    if (!sliderContainer) {
        sliderContainer = document.createElement("div");
        sliderContainer.id = "campteam-slider";
        sliderContainer.style.position = "fixed";
        sliderContainer.style.top = "50%";
        sliderContainer.style.left = "50%";
        sliderContainer.style.transform = "translate(-50%, -50%)";
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

    // Generujemy zawartość slidera z testowym napisem
    let sliderHTML = `
      <div class="swiper-container" style="width:100%; height:100%; text-align:center;">
        <div class="swiper-wrapper">
          ${testImages.map(txt => `
            <div class="swiper-slide" style="display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold; color:white; background:black;">
              ${txt}
            </div>
          `).join("")}
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
        <button id="close-slider" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; padding:5px; cursor:pointer;">✖</button>
      </div>
    `;

    console.log("✅ Generuję slider dla: ", name);

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

// 🟢 **Teraz wymusimy otwarcie slidera, gdy użytkownik kliknie w popup**
document.body.addEventListener("click", async function (event) {
    let popup = event.target.closest(".leaflet-popup-content");
    if (popup) {
        let popupTitle = popup.querySelector("strong");
        if (popupTitle) {
            let campName = popupTitle.textContent.trim();
            console.log("🟢 Kliknięto na popup: ", campName);
            await showSlider(campName);
        } else {
            console.warn("⚠️ Brak nazwy w popupie!");
        }
    }
});
