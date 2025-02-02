if (window.sliderLoadedScript) {
    console.warn("🚨 `slider.js` już jest załadowany! Pomijam ponowne ładowanie.");
    throw new Error("Slider.js już został załadowany!");
}
window.sliderLoadedScript = true;

console.log("✅ Slider.js załadowany!");

// 📌 Debugowanie - czy w ogóle klikamy gdzieś
document.body.addEventListener("click", function(event) {
    alert("📌 Kliknięto w stronę!");
});

// 📌 Obsługa kliknięcia w popup i pobranie poprawnej nazwy
document.body.addEventListener("click", function(event) {
    let popup = event.target.closest(".leaflet-popup-content");

    if (popup) {
        alert("📌 Kliknięto w popup!");

        // 📌 Pobieramy pierwszą linię tekstu w popupie (powinna być nazwą kempingu)
        let popupTextLines = popup.innerText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        
        if (popupTextLines.length > 0) {
            let campName = popupTextLines[0]; // Pierwsza linia powinna zawierać poprawną nazwę
            alert(`🟢 Nazwa kempingu: ${campName}`);
            showSlider(campName);
        } else {
            alert("⚠️ Brak poprawnej nazwy kempingu w popupie!");
        }
    }
});
