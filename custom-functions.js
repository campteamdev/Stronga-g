// Obiekty do przechowywania danych
let detailsMap = {};
let phoneNumbersMap = {};
let websiteLinksMap = {};
let descriptionsMap = {};
let amenitiesMap = {};
let excludedPlaces = new Set();

// Blokowanie prawego przycisku myszy
document.addEventListener("contextmenu", (event) => event.preventDefault());

// Funkcja wczytująca dane z pliku szczegóły.json
async function loadDetails() {
    try {
        const response = await fetch("/szczegoly.json");
        if (!response.ok) throw new Error("Nie udało się załadować szczegóły.json");
        const data = await response.json();
        detailsMap = data.reduce((map, item) => {
            const [name, link] = item.split(",");
            map[name.trim()] = link.trim();
            return map;
        }, {});
    } catch (error) {
        console.error("Błąd podczas wczytywania szczegółów:", error);
    }
}

// Funkcja do wyodrębniania numerów telefonów
function extractPhoneNumber(description) {
    const phoneRegex = /(?:Telefon:|Phone:)?\s*(\+?\d[\d\s\-()]{7,})/i;
    const match = description.match(phoneRegex);
    return match ? match[1].replace(/\s+/g, "") : null;
}

// Funkcja do wyodrębniania strony www
function extractWebsite(description) {
    const websiteRegex = /Website:\s*(https?:\/\/[^\s<]+)/i;
    const match = description.match(websiteRegex);
    return match ? match[1].trim() : null;
}

// Funkcja wczytująca dane z KML
async function loadKmlData() {
    const kmlFiles = [
        "/Atrakcje.kml",
        "/Kempingi.kml",
        "/Kempingi1.kml",
        "/Kempingiopen.kml",
        "/Miejscenabiwak.kml",
        "/Parkingilesne.kml",
        "/Polanamiotowe.kml",
        "/Polanamiotoweopen.kml",
    ];

    for (const url of kmlFiles) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Nie udało się załadować: ${url}`);
            const kmlText = await response.text();
            const parser = new DOMParser();
            const kml = parser.parseFromString(kmlText, "application/xml");
            const placemarks = kml.getElementsByTagName("Placemark");

            for (const placemark of placemarks) {
                const name = placemark.getElementsByTagName("name")[0]?.textContent.trim();
                const description = placemark.getElementsByTagName("description")[0]?.textContent.trim();
                const website = extractWebsite(description);

                if (name) {
                    phoneNumbersMap[name] = extractPhoneNumber(description) || "Brak numeru";
                    websiteLinksMap[name] = website || "Brak strony";
                    descriptionsMap[name] = description || "Brak opisu";
                    amenitiesMap[name] = placemark.querySelector("Data[name='Udogodnienia:'] > value")?.textContent.trim() || "Brak udogodnień";
                }
            }
        } catch (error) {
            console.error(`Błąd podczas przetwarzania pliku ${url}:`, error);
        }
    }
}

// Funkcja generująca treść popupu w stylu UI ze zdjęciem i przyciskami
function generatePopupContent(name, lat, lon) {
    const phone = phoneNumbersMap[name] || "Brak numeru";
    const website = websiteLinksMap[name] !== "Brak strony" ? `<a href="${websiteLinksMap[name]}" target="_blank">${websiteLinksMap[name]}</a>` : "Brak strony";
    const description = descriptionsMap[name] || "Brak opisu";
    const amenities = amenitiesMap[name] || "Brak udogodnień";

    return `
        <div style="font-family: Arial, sans-serif; max-width: 320px; border-radius: 10px; overflow: hidden; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);">
            <img src="https://source.unsplash.com/300x150/?camping" style="width: 100%; height: 150px; object-fit: cover;" alt="Zdjęcie kempingu">
            <div style="padding: 10px;">
                <h3 style="margin: 5px 0;">${name}</h3>
                <p style="margin: 2px 0;"><strong>📍 Adres:</strong> ${lat}, ${lon}</p>
                <p style="margin: 2px 0;"><strong>📞 Telefon:</strong> <a href="tel:${phone}">${phone}</a></p>
                <p style="margin: 2px 0;"><strong>🌍 Strona:</strong> ${website}</p>
                <p style="margin: 2px 0;"><strong>📝 Opis:</strong> ${description.length > 100 ? description.substring(0, 100) + '...' : description}</p>
                <p style="margin: 2px 0;"><strong>🛠️ Udogodnienia:</strong> ${amenities}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" style="background: #34a853; color: white; padding: 8px; text-align: center; flex: 1; text-decoration: none; border-radius: 5px; margin-right: 5px;">🧭 Nawiguj</a>
                    <a href="tel:${phone}" style="background: #4285f4; color: white; padding: 8px; text-align: center; flex: 1; text-decoration: none; border-radius: 5px;">📞 Zadzwoń</a>
                </div>
            </div>
        </div>
    `;
}

// Aktualizacja popupów
function updatePopups(markers) {
    markers.forEach(({ marker, name, lat, lon }) => {
        const popupContent = generatePopupContent(name, lat, lon);
        marker.bindPopup(popupContent, {
            minWidth: 300,
            maxWidth: 320,
            autoPan: true
        });
    });
}

// Ładowanie danych i aktualizacja popupów
async function loadDetailsAndUpdatePopups(markers) {
    await loadDetails();
    await loadKmlData();
    updatePopups(markers);
}

// Zapobiega zamykaniu popupu przy dotyku na mobile
document.addEventListener("touchstart", function (event) {
    if (event.target.closest(".leaflet-popup-content")) {
        event.preventDefault();
    }
}, { passive: false });
