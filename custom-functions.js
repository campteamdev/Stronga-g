// Obiekt przechowujący wszystkie dane
let locationsData = {};

// Blokowanie prawego przycisku myszy
document.addEventListener("contextmenu", (event) => event.preventDefault());

// Funkcja wczytująca dane z pliku szczegóły.json
async function loadDetails() {
    try {
        const response = await fetch("/szczegoly.json");
        if (!response.ok) throw new Error("Nie udało się załadować szczegóły.json");
        const data = await response.json();

        data.forEach((item) => {
            const [name, link] = item.split(",");
            locationsData[name.trim()] = { detailsLink: link.trim() };
        });
    } catch (error) {
        console.error("Błąd podczas wczytywania szczegółów:", error);
    }
}

// Funkcja do wyodrębniania numerów telefonów
function extractPhoneNumber(description) {
    const phoneRegex = /(?:Telefon:|Phone:)?\s*(\+?\d[\d\s\-()]{7,})/i;
    const urlRegex = /https?:\/\/[^\s]+/gi;
    return description.replace(urlRegex, "").match(phoneRegex)?.[1]?.replace(/\s+/g, "") || null;
}

// Funkcja do wyodrębniania strony www
function extractWebsite(description) {
    return description.match(/Website:\s*(https?:\/\/[^\s<]+)/i)?.[1]?.trim() || null;
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

    await Promise.all(kmlFiles.map(async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Nie udało się załadować: ${url}`);
            const kmlText = await response.text();
            const parser = new DOMParser();
            const kml = parser.parseFromString(kmlText, "application/xml");

            Array.from(kml.getElementsByTagName("Placemark")).forEach((placemark) => {
                const name = placemark.getElementsByTagName("name")[0]?.textContent.trim();
                const description = placemark.getElementsByTagName("description")[0]?.textContent.trim();
                const children = Array.from(placemark.children);
                const website = children.find(el => el.getAttribute("name") === "Strona www:")?.textContent.trim() || extractWebsite(description);
                const opis = children.find(el => el.getAttribute("name") === "Opis:")?.textContent.trim() || "";
                let infrastruktura = children.find(el => el.getAttribute("name") === "Udogodnienia:")?.textContent.trim() || "";

                if (infrastruktura) {
                    infrastruktura = infrastruktura.replace(/- nr:? \d+/g, "").split("\n").join("<br>");
                }

                if (name) {
                    locationsData[name] = {
                        phone: extractPhoneNumber(description) || "Brak numeru kontaktowego",
                        website,
                        description: opis,
                        amenities: infrastruktura,
                    };
                }
            });
        } catch (error) {
            console.error(`Błąd podczas przetwarzania pliku ${url}:`, error);
        }
    }));
}

// Funkcja skracająca tekst do 3 linijek
function shortenText(text, id) {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length > 30) {
        const shortText = words.slice(0, 30).join(" ") + "...";
        return `
          <span id="${id}-short">${shortText}</span>
          <span id="${id}-full" style="display:none;">${text.replace(/\n/g, "<br>")}</span>
          <a href="#" onclick="document.getElementById('${id}-short').style.display='none';
                              document.getElementById('${id}-full').style.display='inline';
                              this.style.display='none'; return false;">
            Pokaż więcej
          </a>`;
    }
    return text.replace(/\n/g, "<br>");
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon) {
    const data = locationsData[name] || {};
    return `
        <div style="border:2px solid green; padding:3px; display:inline-block; font-size:14px; font-weight:bold; max-width:auto; user-select: none;">
            ${name}
        </div><br>
        <div style="word-wrap: break-word; user-select: none;">
            <strong style="font-size:12px;">Kontakt:</strong> ${data.phone ? `<a href="tel:${data.phone}" style="color:blue; text-decoration:none; font-size:10px;">${data.phone}</a>` : "Brak numeru"}<br>
            ${data.website ? `<strong style="font-size:12px;">Strona:</strong> <a href="${data.website}" target="_blank" style="color:red; text-decoration:none; font-size:10px;">${data.website}</a><br>` : ""}
            <div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px;">Opis:</div><br>
            ${data.description ? `<span style="font-size:10px;">${shortenText(data.description, `opis-${name}`)}</span>` : "<i>Brak opisu</i>"}<br>
            <div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px;">Infrastruktura:</div><br>
            ${data.amenities ? `<span style="font-size:10px;">${data.amenities}</span>` : "<i>Brak informacji</i>"}<br>
            <a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button">Link do Map Google</a><br>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button">Prowadź</a><br>
            <a href="https://www.campteam.pl/dodaj/dodaj-zdjecie-lub-opinie" target="_blank" class="update-button">Dodaj Zdjęcie/Aktualizuj</a>
        </div>`;
}

// Aktualizacja popupów
function updatePopups(markers) {
    markers.forEach(({ marker, name, lat, lon }) => {
        marker.bindPopup(generatePopupContent(name, lat, lon));
    });
}

// Ładowanie danych i aktualizacja popupów
async function loadDetailsAndUpdatePopups(markers) {
    await loadDetails();
    await loadKmlData();
    updatePopups(markers);
}
