// Obiekty do przechowywania danych
let detailsMap = {};
let phoneNumbersMap = {};
let websiteLinksMap = {};
let descriptionsMap = {};
let amenitiesMap = {};
let excludedPlaces = new Set();

// Blokowanie prawego przycisku myszy
document.addEventListener("contextmenu", (event) => event.preventDefault());

// Pobieranie zdjęć z `images.json`
async function fetchImages(name) {
    try {
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error('❌ Nie udało się pobrać images.json');

        const data = await response.json();
        console.log("📂 Załadowano images.json:", data);

        // Formatowanie nazwy (usunięcie polskich znaków, spacje na "_")
        const formattedName = name
            .trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");

        console.log("🔎 Sprawdzam klucze:", name, formattedName);

        // Sprawdzamy oba warianty nazwy w pliku JSON
        return data[name] || data[formattedName] || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Funkcja generująca treść popupu (zachowuje wszystkie dotychczasowe funkcje)
async function generatePopupContent(name, lat, lon) {
    let popupContent = `<div style="border:2px solid green; padding:3px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%;
        user-select: none;">${name}</div><br>`;

    // **Dodajemy slider tylko dla "Górska Sadyba"**
    let sliderHTML = "";
    if (name === "Górska Sadyba") {
        const images = await fetchImages(name);

        if (images.length > 0) {
            sliderHTML = `
                <div class="swiper-container" style="width:100%; height:200px; margin-bottom: 10px;">
                    <div class="swiper-wrapper">
                        ${images.map(img => `
                            <div class="swiper-slide">
                                <img src="${img}" class="slider-img" style="width:100%; height:100%; object-fit:cover; border-radius: 10px;">
                            </div>
                        `).join("")}
                    </div>
                    <div class="swiper-pagination"></div>
                    <div class="swiper-button-next"></div>
                    <div class="swiper-button-prev"></div>
                </div>
            `;
        }
    }

    popupContent += `<div style="max-width: 80%; word-wrap: break-word; user-select: none;">`;

    // **Numer telefonu**
    const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
    const phoneLink = phone !== "Brak numeru kontaktowego"
        ? `<a href="tel:${phone}" style="color:blue; text-decoration:none; font-size:10px; user-select: none;">${phone}</a>`
        : `<span style="font-size:10px; user-select: none;">${phone}</span>`;

    popupContent += `<strong style="font-size:12px; user-select: none;">Kontakt:</strong> ${phoneLink}<br>`;

    // **Strona internetowa**
    if (websiteLinksMap[name]) {
        popupContent += `
            <strong style="font-size:12px; user-select: none;">Strona:</strong> 
            <a href="${websiteLinksMap[name]}" target="_blank" style="color:red; text-decoration:none; font-size:10px; user-select: none;">
                ${websiteLinksMap[name]}
            </a><br>`;
    }

    // **Opis**
    popupContent += `<div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px; user-select: none;">Opis:</div><br>`;
    popupContent += descriptionsMap[name]
        ? `<span style="font-size:10px; user-select: none;">${shortenText(descriptionsMap[name], `opis-${name}`)}</span>`
        : `<span style="font-size:10px; user-select: none;"><i>Brak opisu</i></span>`;

    // **Infrastruktura**
    popupContent += `<br><div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px; user-select: none;">Infrastruktura:</div><br>`;
    popupContent += amenitiesMap[name]
        ? `<span style="font-size:10px; user-select: none;">${amenitiesMap[name]}</span>`
        : `<span style="font-size:10px; user-select: none;"><i>Brak informacji</i></span>`;

    // **Linki**
    popupContent += `
        <br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button" style="font-size:12px; user-select: none;">Link do Map Google</a>
        <br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button" style="font-size:12px; user-select: none;">Prowadź</a>
        <br><a href="https://www.campteam.pl/dodaj/dodaj-zdj%C4%99cie-lub-opini%C4%99" target="_blank" class="update-button" style="font-size:12px; user-select: none;">Dodaj Zdjęcię/Aktualizuj</a>
    `;

    popupContent += `</div>`; // Zamknięcie kontenera popupu

    // ✅ **Dodajemy slider na początek treści popupu, jeśli istnieje**
    return sliderHTML + popupContent;
}

// Aktualizacja popupów z ustawioną szerokością i wysokością
function updatePopups(markers) {
    markers.forEach(({ marker, name, lat, lon }) => {
        generatePopupContent(name, lat, lon).then(content => {
            marker.bindPopup(content, {
                minWidth: 200,  // Minimalna szerokość popupu
                maxWidth: 220,  // Maksymalna szerokość popupu
                maxHeight: 300, // Maksymalna wysokość popupu
                autoPan: true   // Automatyczne przesuwanie mapy, gdy popup wychodzi poza ekran
            });
        });
    });
}

// Ładowanie danych i aktualizacja popupów
async function loadDetailsAndUpdatePopups(markers) {
    await loadDetails();
    await loadKmlData();
    updatePopups(markers);
}

// Blokada kopiowania na dotykowych urządzeniach
document.addEventListener("touchstart", function (event) {
    if (event.target.closest(".leaflet-popup-content")) {
        event.preventDefault();
    }
}, { passive: false });
