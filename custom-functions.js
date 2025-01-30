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
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const match = description.replace(urlRegex, "").match(phoneRegex);
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
        const website = placemark.querySelector("Data[name='Strona www:'] > value")?.textContent.trim() || extractWebsite(description);

        // Pobieranie danych Opis i Infrastruktura
        const opisNode = placemark.querySelector("Data[name='Opis:'] > value");
        const infrastrukturaNode = placemark.querySelector("Data[name='Udogodnienia:'] > value");

        const opis = opisNode ? opisNode.textContent.trim() : "";
        let infrastruktura = infrastrukturaNode ? infrastrukturaNode.textContent.trim() : "";

        // Usunięcie "nr: X" z infrastruktury
        if (infrastruktura) {
          infrastruktura = infrastruktura.replace(/- nr:? \d+/g, "").trim();
          infrastruktura = infrastruktura.split("\n").join("<br>"); // Każdy element w nowej linii
        }

        if (name) {
          if (description) {
            const phone = extractPhoneNumber(description);
            phoneNumbersMap[name] = phone || "Brak numeru kontaktowego";
          }
          if (website) {
            websiteLinksMap[name] = website;
          }
          descriptionsMap[name] = opis;
          amenitiesMap[name] = infrastruktura;
        }
      }
    } catch (error) {
      console.error(`Błąd podczas przetwarzania pliku ${url}:`, error);
    }
  }
}

// Funkcja dynamicznego dostosowania szerokości popupa do treści
function adjustPopupWidth(popupElement) {
  let maxWidth = 0;
  popupElement.querySelectorAll("span, div, a, strong").forEach((element) => {
    let width = element.offsetWidth;
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
