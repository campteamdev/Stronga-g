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

    if (!matchingKey) {
        console.warn("🚫 Brak zdjęć dla:", name);
        return;
    }

    let images = imagesData[matchingKey];

    console.log("📷 Liczba znalezionych zdjęć:", images.length);

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
        sliderContainer.style.b
