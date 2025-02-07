// 🔹 Obiekty do przechowywania danych
let detailsMap = {};
let phoneNumbersMap = {};
let websiteLinksMap = {};
let descriptionsMap = {};
let amenitiesMap = {};
let excludedPlaces = new Set();

// 🔹 Definicja ikon (przywrócona!)
const icons = {
    kempingi: L.icon({
        iconUrl: "/ikony/Ikona_Kempingi_Polecane.png",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    }),
    polanamiotowe: L.icon({
        iconUrl: "/ikony/Ikona_Pole_Namiotowe.png",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    }),
    kempingiopen: L.icon({
        iconUrl: "/ikony/Ikona_Kempingi.png",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -10],
    }),
    polanamiotoweopen: L.icon({
        iconUrl: "/ikony/Ikona_Pole_Namiotowe.png",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -10],
    }),
    parkingilesne: L.icon({
        iconUrl: "/ikony/Ikona_Parking_Le%C5%9Bny.png",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -10],
    }),
    miejscenabiwak: L.icon({
        iconUrl: "/ikony/Ikona_Miejsce_Biwakowe.png",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -10],
    }),
};

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

// 🔹 Funkcja generująca popupy
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
        <div style="border:2px solid green; padding:3px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%; user-select: none;">${name}</div><br>
        <strong>Kontakt:</strong> ${phoneNumbersMap[name] || "Brak numeru kontaktowego"}<br>
        ${websiteLinksMap[name] ? `<strong>Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank">${websiteLinksMap[name]}</a><br>` : ""}
        <strong>Opis:</strong> ${descriptionsMap[name] ? shortenText(descriptionsMap[name], `opis-${name}`) : "<i>Brak opisu</i>"}<br>
        <strong>Infrastruktura:</strong> ${amenitiesMap[name] || "<i>Brak informacji</i>"}<br>
        <a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button">Link do Map Google</a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button">Prowadź</a>
    `;
}

// 🔹 Nowa funkcja aktualizująca popupy
async function updatePopups(markers) {
    for (let { marker, name, lat, lon } of markers) {
        const popupContent = await generatePopupContent(name, lat, lon);
        marker.bindPopup(popupContent, {
            minWidth: 200,
            maxWidth: 220,
            maxHeight: 300,
            autoPan: true
        });
    }
}

// 🔹 Nowa funkcja ładowania danych i aktualizacji popupów
async function loadDetailsAndUpdatePopups(markers) {
    await loadDetails();
    await loadKmlData();
    await updatePopups(markers);
}

// 🔹 Blokowanie prawego przycisku myszy
document.addEventListener("contextmenu", (event) => event.preventDefault());

// 🔹 Blokada dotyku na popupie
document.addEventListener("touchstart", function (event) {
    if (event.target.closest(".leaflet-popup-content")) {
        event.preventDefault();
    }
}, { passive: false });

