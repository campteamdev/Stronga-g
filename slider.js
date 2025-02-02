if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

document.body.addEventListener("click", function(event) {
    alert("📌 Kliknięto w stronę!");
});

document.body.addEventListener("click", function(event) {
    let popup = event.target.closest(".leaflet-popup-content");
    
    if (popup) {
        alert("📌 Kliknięto w popup!");
        
        let popupTitle = popup.querySelector("div strong");
        if (popupTitle) {
            let campName = popupTitle.textContent.trim();
            alert(`🟢 Nazwa kempingu: ${campName}`);
            showSlider(campName);
        } else {
            alert("⚠️ Brak nazwy kempingu w popupie!");
        }
    }
});
