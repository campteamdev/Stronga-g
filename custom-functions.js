// Obiekty do przechowywania danych
let detailsMap = {};
let phoneNumbersMap = {};
let websiteLinksMap = {};
let descriptionsMap = {};
let amenitiesMap = {};
let excludedPlaces = new Set();

// Blokowanie prawego przycisku myszy
document.addEventListener("contextmenu", (event) => event.preventDefault());

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon) {
  let popupContent = `<div class="popup-container">${name}</div><br>`;

  // Kontener popupu
  popupContent += `<div class="popup-content">`;

  // Numer telefonu
  const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
  const phoneLink =
    phone !== "Brak numeru kontaktowego"
      ? `<a href="tel:${phone}" class="phone-link">${phone}</a>`
      : `<span class="phone-text">${phone}</span>`;
  popupContent += `<strong>Kontakt:</strong> ${phoneLink}<br>`;

  // Strona internetowa
  if (websiteLinksMap[name]) {
    popupContent += `<strong>Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank" class="website-link">${websiteLinksMap[name]}</a><br>`;
  }

  // Opis
  popupContent += `<div class="popup-title">Opis:</div><br>`;
  popupContent += descriptionsMap[name] 
    ? `<span>${shortenText(descriptionsMap[name], `opis-${name}`)}</span>` 
    : `<span><i>Brak opisu</i></span>`;

  // Infrastruktura
  popupContent += `<br><div class="popup-title">Infrastruktura:</div><br>`;
  popupContent += amenitiesMap[name] 
    ? `<span>${amenitiesMap[name]}</span>` 
    : `<span><i>Brak informacji</i></span>`;

  // Linki
  popupContent += `<br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button">Link do Map Google</a>`;
  popupContent += `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button">Prowadź</a>`;
  popupContent += `<br><a href="https://www.campteam.pl/dodaj/dodaj-zdjecie-lub-opinie" target="_blank" class="update-button">Dodaj Zdjęcie/Aktualizuj</a>`;

  popupContent += `</div>`; // Zamknięcie kontenera popupu
  return popupContent;
}

// Funkcja dopasowująca szerokość popupu do zoomu mapy
function adjustPopupSize() {
  let zoomLevel = map.getZoom(); // Pobierz aktualny poziom zoomu

  document.querySelectorAll(".leaflet-popup-content").forEach(popup => {
    if (zoomLevel > 12) {
      popup.style.maxWidth = "400px";  // Największy popup przy dużym zoomie
    } else if (zoomLevel > 10) {
      popup.style.maxWidth = "350px";  // Średni zoom
    } else if (zoomLevel > 8) {
      popup.style.maxWidth = "300px";  // Trochę oddalone
    } else {
      popup.style.maxWidth = "250px";  // Daleko oddalony widok
    }
  });
}

// Aktualizacja popupów
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon }) => {
    const popupContent = generatePopupContent(name, lat, lon);
    marker.bindPopup(popupContent);
  });

  // Dodanie eventu, który zmienia rozmiar popupu po każdej zmianie zoomu mapy
  map.on("zoomend", adjustPopupSize);
}

// Ładowanie danych i aktualizacja popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails();
  await loadKmlData();
  updatePopups(markers);
}
