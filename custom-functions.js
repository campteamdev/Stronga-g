// Obiekty do przechowywania danych
let detailsMap = {};
let phoneNumbersMap = {};
let websiteLinksMap = {};
let descriptionsMap = {};
let amenitiesMap = {};
let excludedPlaces = new Set();

// Blokowanie prawego przycisku myszy
document.addEventListener("contextmenu", (event) => event.preventDefault());

// Funkcja skracająca tekst do 3 linijek
function shortenText(text, id) {
  if (!text) return ""; // Jeśli brak treści, zwróć pusty ciąg
  const words = text.split(" ");
  if (words.length > 30) { // Przybliżona liczba słów na 3 linijki
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
  return `
    <div class="popup-container">
      <div class="popup-title">${name}</div>
      <div class="popup-content">
        <strong>Kontakt:</strong> ${phoneNumbersMap[name] ? `<a href="tel:${phoneNumbersMap[name]}" class="phone-link">${phoneNumbersMap[name]}</a>` : "Brak numeru"}<br>
        ${websiteLinksMap[name] ? `<strong>Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank" class="website-link">${websiteLinksMap[name]}</a><br>` : ""}
        
        <div class="popup-section">
          <div class="popup-label">Opis:</div>
          <div class="popup-text">${descriptionsMap[name] ? shortenText(descriptionsMap[name], `opis-${name}`) : "<i>Brak opisu</i>"}</div>
        </div>

        <div class="popup-section">
          <div class="popup-label">Infrastruktura:</div>
          <div class="popup-text">${amenitiesMap[name] ? amenitiesMap[name] : "<i>Brak informacji</i>"}</div>
        </div>

        <div class="popup-links">
          <a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button">Link do Map Google</a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button">Prowadź</a>
          <a href="https://www.campteam.pl/dodaj/dodaj-zdj%C4%99cie-lub-opini%C4%99" target="_blank" class="update-button">Dodaj Zdjęcie/Aktualizuj</a>
        </div>
      </div>
    </div>`;
}

// Dopasowanie szerokości popupu do zoomu
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
