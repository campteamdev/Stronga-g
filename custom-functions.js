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

// Funkcja dynamicznego dostosowania szerokości popupa do najdłuższego wiersza tekstu
function adjustPopupWidth(popupElement) {
  let maxWidth = 0;
  popupElement.querySelectorAll("span, div, a, strong").forEach((element) => {
    let width = element.scrollWidth;
    if (width > maxWidth) {
      maxWidth = width;
    }
  });

  popupElement.style.width = `${maxWidth + 20}px`; // Dodajemy trochę marginesu
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon) {
  let popupContent = `<div style="border:2px solid green; padding:3px; font-size:14px; font-weight:bold; user-select: none;">${name}</div><br>`;

  // Kontener popupu z blokadą zaznaczania tekstu
  popupContent += `<div style="word-wrap: break-word; user-select: none;">`;

  // Numer telefonu
  const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
  popupContent += `<strong>Kontakt:</strong> ${phone}<br>`;

  // Strona internetowa
  if (websiteLinksMap[name]) {
    popupContent += `<strong>Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank">${websiteLinksMap[name]}</a><br>`;
  }

  // Opis
  popupContent += `<strong>Opis:</strong><br>`;
  popupContent += descriptionsMap[name] ? `${descriptionsMap[name]}` : `<i>Brak opisu</i>`;

  // Infrastruktura
  popupContent += `<br><strong>Infrastruktura:</strong><br>`;
  popupContent += amenitiesMap[name] ? `${amenitiesMap[name]}` : `<i>Brak informacji</i>`;

  // Linki
  popupContent += `<br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank">Link do Map Google</a>`;
  popupContent += `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank">Prowadź</a>`;
  popupContent += `<br><a href="https://www.campteam.pl/dodaj/dodaj-zdjecie-lub-opinie" target="_blank">Dodaj Zdjęcie/Aktualizuj</a>`;

  popupContent += `</div>`;
  return popupContent;
}

// Aktualizacja popupów
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon }) => {
    const popupContent = generatePopupContent(name, lat, lon);
    marker.bindPopup(popupContent);

    // Dodaj event, który dostosuje szerokość popupa po jego otwarciu
    marker.on("popupopen", function () {
      setTimeout(() => {
        let popupElement = document.querySelector(".leaflet-popup-content");
        if (popupElement) {
          adjustPopupWidth(popupElement);
        }
      }, 50); // Krótkie opóźnienie na renderowanie treści
    });
  });
}

// Ładowanie danych i aktualizacja popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails();
  await loadKmlData();
  updatePopups(markers);
}
