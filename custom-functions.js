// 🔹 Obiekty do przechowywania danych
let detailsMap = {};
let phoneNumbersMap = {};
let websiteLinksMap = {};
let descriptionsMap = {};
let amenitiesMap = {};
let excludedPlaces = new Set();

// 🔹 Blokowanie prawego przycisku myszy
document.addEventListener("contextmenu", (event) => event.preventDefault());

// 🔹 Funkcja wczytująca dane z pliku szczegóły.json
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

// 🔹 Funkcja pobierająca zdjęcia z GitHuba
async function getLocationImages(name) {
    const githubRepo = "https://raw.githubusercontent.com/NAZWA_UŻYTKOWNIKA/NAZWA_REPOZYTORIUM/main/";
    const folderName = name.replace(/\s/g, "_"); // Zamiana spacji na podkreślniki
    const folderUrl = `${githubRepo}${encodeURIComponent(folderName)}/`;
    const imageExtensions = ["jpg", "jpeg", "webp"];
    let images = [];

    try {
        const response = await fetch(`https://api.github.com/repos/NAZWA_UŻYTKOWNIKA/NAZWA_REPOZYTORIUM/contents/${encodeURIComponent(folderName)}`);
        if (response.ok) {
            const data = await response.json();
            images = data
                .filter(file => imageExtensions.includes(file.name.split('.').pop().toLowerCase()))
                .slice(0, 5) // Maksymalnie 5 zdjęć
                .map(file => `${folderUrl}${file.name}`);
        }
    } catch (error) {
        console.warn(`Brak folderu ze zdjęciami dla: ${name}`);
    }

    return images;
}

// 🔹 Funkcja generująca treść popupu
async function generatePopupContent(name, lat, lon) {
    const images = await getLocationImages(name);

    let imageSlider = "";
    if (images.length > 0) {
        imageSlider = `
            <div class="swiper-container" style="width:100%; height: 150px;">
                <div class="swiper-wrapper">
                    ${images.map(img => `<div class="swiper-slide"><img src="${img}" style="width:100%; height:150px; object-fit:cover; border-radius:8px;"></div>`).join("")}
                </div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
            <script>
                new Swiper('.swiper-container', {
                    loop: true,
                    pagination: { el: '.swiper-pagination', clickable: true },
                    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
                });
            </script>
        `;
    }

    return `
        ${imageSlider}
        <div style="border:2px solid green; padding:3px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%;">${name}</div><br>
        <strong>Kontakt:</strong> ${phoneNumbersMap[name] || "Brak numeru kontaktowego"}<br>
        ${websiteLinksMap[name] ? `<strong>Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank">${websiteLinksMap[name]}</a><br>` : ""}
        <strong>Opis:</strong> ${descriptionsMap[name] ? descriptionsMap[name] : "<i>Brak opisu</i>"}<br>
        <strong>Infrastruktura:</strong> ${amenitiesMap[name] || "<i>Brak informacji</i>"}<br>
    `;
}

// 🔹 Funkcja aktualizująca popupy (poprawiona obsługa asynchroniczna)
async function updatePopups(markers) {
    for (let { marker, name, lat, lon } of markers) {
        marker.bindPopup("Ładowanie...", { minWidth: 200, maxWidth: 220, maxHeight: 300, autoPan: true });

        marker.on("click", async function () {
            const popupContent = await generatePopupContent(name, lat, lon);
            marker.setPopupContent(popupContent);
        });
    }
}

// 🔹 Funkcja wczytująca dane z KML
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
                const coordinates = placemark.getElementsByTagName("coordinates")[0]?.textContent.trim();
                if (!coordinates) continue;

                const [lon, lat] = coordinates.split(",");

                const marker = L.marker([lat, lon]).addTo(markerCluster);
                marker.bindPopup("Ładowanie...", { minWidth: 200, maxWidth: 220, maxHeight: 300, autoPan: true });

                marker.on("click", async function () {
                    const popupContent = await generatePopupContent(name, lat, lon);
                    marker.setPopupContent(popupContent);
                });
            }
        } catch (error) {
            console.error(`Błąd podczas przetwarzania pliku ${url}:`, error);
        }
    }
}

// 🔹 Funkcja inicjalizująca mapę i ładująca punkty
async function initializeMap() {
    await loadDetails();
    await loadKmlData();
}

// 🔹 Uruchomienie mapy
initializeMap();
