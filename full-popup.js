document.addEventListener("DOMContentLoaded", function () { 
    console.log("✅ [full-popup.js] Załadowano pełnoekranowy popup");

    const fullPopup = document.createElement("div");
    fullPopup.id = "full-popup";
    fullPopup.style.position = "fixed";
    fullPopup.style.left = "50%";
    fullPopup.style.transform = "translateX(-50%)";
    fullPopup.style.width = "50%";
    fullPopup.style.height = "100%";
    fullPopup.style.background = "white";
    fullPopup.style.color = "black";
    fullPopup.style.display = "none";
    fullPopup.style.flexDirection = "column";
    fullPopup.style.alignItems = "center";
    fullPopup.style.justifyContent = "flex-start";
    fullPopup.style.padding = "20px";
    fullPopup.style.zIndex = "10000";
    fullPopup.style.overflowY = "auto";
    fullPopup.style.maxHeight = "calc(100% - 20px)";
    fullPopup.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
    fullPopup.style.borderRadius = "10px";
    document.body.appendChild(fullPopup);

    function adjustPopupWidth() {
        fullPopup.style.width = window.innerWidth <= 768 ? "100%" : "50%";
    }
    window.addEventListener("resize", adjustPopupWidth);
    adjustPopupWidth();

    // 🔹 Przycisk zamykania
    const closeButton = document.createElement("button");
    closeButton.textContent = "✖ Zamknij";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.background = "green";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.padding = "5px 10px";
    closeButton.style.fontSize = "14px";
    closeButton.style.cursor = "pointer";
    closeButton.style.borderRadius = "5px";
    closeButton.addEventListener("click", function () {
        fullPopup.style.display = "none";
    });
    fullPopup.appendChild(closeButton);

    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("full-popup-button")) {
            const name = event.target.dataset.name;
            const lat = event.target.dataset.lat;
            const lon = event.target.dataset.lon;

            console.log(`🔍 [full-popup] Otwieranie pełnoekranowego popupu dla: ${name}`);

            const { sliderHTML, images } = await generateImageSlider(name, lat, lon);

            fullPopup.innerHTML = `
                <button id="close-full-popup" style="position:absolute; top:10px; right:10px; background:green; color:white; border:none; padding:5px 10px; font-size:14px; cursor:pointer; border-radius:5px;">✖ Zamknij</button>
                
                <div id="slider-container" style="position: relative; width: 100%; max-width: 400px; height: 60vh; min-height: 300px; overflow: hidden; margin: auto; display: flex; align-items: center; justify-content: center;">
                    ${sliderHTML}
                </div>

                <div style='max-width: 90%; margin: auto; text-align:center;'>
                    <h2>${name}</h2>
                    <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" style="display:block; text-align:center; color:#0f0; font-size:18px; margin-top:10px;">📍 Otwórz w Google Maps</a>
                </div>
            `;

            fullPopup.style.display = "flex";

            setTimeout(() => {
                initializeSwiper(name, images);
                document.getElementById("close-full-popup").addEventListener("click", function () {
                    fullPopup.style.display = "none";
                });
                
                document.querySelectorAll(".slider-image").forEach(img => {
                    if (!img.src || img.src.includes("undefined")) {
                        console.error("❌ Błąd ładowania obrazu: Brak poprawnego src", img);
                        return;
                    }
                    img.addEventListener("click", function () {
                        fullPopup.style.display = "none";
                        const overlay = document.createElement("div");
                        overlay.style.position = "fixed";
                        overlay.style.top = "0";
                        overlay.style.left = "0";
                        overlay.style.width = "100vw";
                        overlay.style.height = "100vh";
                        overlay.style.background = "rgba(0, 0, 0, 0.8)";
                        overlay.style.display = "flex";
                        overlay.style.alignItems = "center";
                        overlay.style.justifyContent = "center";
                        overlay.style.zIndex = "10002";
                        overlay.id = "image-overlay";

                        const enlargedImg = document.createElement("img");
                        enlargedImg.src = img.src;
                        enlargedImg.style.maxWidth = "90vw";
                        enlargedImg.style.maxHeight = "90vh";
                        enlargedImg.style.cursor = "zoom-out";

                        overlay.appendChild(enlargedImg);
                        document.body.appendChild(overlay);

                        overlay.addEventListener("click", function () {
                            document.body.removeChild(overlay);
                            fullPopup.style.display = "flex";
                        });
                    });
                });
            }, 500);
        }
    });
});
