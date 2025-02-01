alert("✅ Slider.js załadowany!");

async function showSlider(name) {
    alert("🔍 Uruchamiam slider dla: " + name);

    // Formatowanie nazwy pliku
    const formattedName = name
        .trim()
        .replace(/\s+/g, "_") 
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    alert("📷 Sprawdzam zdjęcia dla: " + formattedName);

    // Ścieżki do zdjęć w formatach .jpeg i .jpg
    const images = [
        `/foty/${formattedName}_1.jpg`,
        `/foty/${formattedName}_1.jpeg`,
        `/foty/${formattedName}_2.jpg`,
        `/foty/${formattedName}_2.jpeg`,
        `/foty/${formattedName}_3.jpg`,
        `/foty/${formattedName}_3.jpeg`
    ];

    alert("🔍 Szukam zdjęć: " + images.join(", "));

    // Sprawdzamy, które zdjęcia faktycznie istnieją
    let validImages = [];
    for (let img of images) {
        let testImg = new Image();
        testImg.src = img;
        await new Promise((resolve) => {
            testImg.onload = () => {
                validImages.push(img);
                resolve();
            };
            testImg.onerror = () => {
                alert("❌ Brak zdjęcia: " + img);
                resolve();
            };
        });
    }

    alert("📷 Liczba znalezionych zdjęć: " + validImages.length);

    // Jeśli brak zdjęć, nie pokazujemy slidera
    if (validImages.length === 0) {
        alert("🚫 Brak zdjęć, slider nie zostanie pokazany.");
        return;
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

    alert("✅ Generuję slider...");

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

    alert("🚀 Slider pokazany!");

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
            alert("🟢 Kliknięto na marker: " + popupTitle.textContent.trim());
            await showSlider(popupTitle.textContent.trim());
        } else {
            alert("⚠️ Brak nazwy kempingu w popupie!");
        }
    }
});
