// Obiekty do przechowywania danych
let detailsMap = {};
let phoneNumbersMap = {};
let websiteLinksMap = {};
let descriptionsMap = {};
let amenitiesMap = {};
let excludedPlaces = new Set();

document.addEventListener("contextmenu", (event) => event.preventDefault());

// Pobranie elementów modala
const modalPopup = document.getElementById("modal-popup");
const popupContent = document.getElementById("popup-inner-content");

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

// Funkcja generująca treść popupu w modalnym oknie
function showPopup(name, lat, lon) {
    let popupHTML = `<h2>${name}</h2>`;

    // Telefon
    const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
    popupHTML += `<p><strong>Kontakt:</strong> ${phone}</p>`;

    // Strona internetowa
    if (websiteLinksMap[name]) {
        popupHTML += `<p><strong>Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank">${websiteLinksMap[name]}</a></p>`;
    }

    // Opis
    if (descriptionsMap[name]) {
        popupHTML += `<p><strong>Opis:</strong> ${descriptionsMap[name]}</p>`;
    }

    // Infrastruktura
    if (amenitiesMap[name]) {
        popupHTML += `<p><strong>Infrastruktura:</strong> ${amenitiesMap[name]}</p>`;
    }

    // Linki nawigacyjne
    popupHTML += `<a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button">Link do Map Google</a>`;
    popupHTML += `<a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button">Prowadź</a>`;
    popupHTML += `<a href="https://www.campteam.pl/dodaj/dodaj-zdjęcie-lub-opinię" target="_blank" class="update-button">Dodaj Zdjęcie/Aktualizuj</a>`;

    popupContent.innerHTML = popupHTML; // Wstawienie treści popupu do modala
    modalPopup.style.display = "flex"; // Wyświetlenie modala
}

// Funkcja aktualizująca popupy dla markerów
function updatePopups(markers) {
    markers.forEach(({ marker, name, lat, lon }) => {
        marker.on("click", function () {
            showPopup(name, lat, lon);
        });
    });
}

// Ładowanie danych i aktualizacja popupów
async function loadDetailsAndUpdatePopups(markers) {
    await loadDetails();
    updatePopups(markers);
}
