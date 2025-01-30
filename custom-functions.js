// Obiekt do przechowywania danych ze szczegóły.json
let detailsMap = {};
// Obiekt do przechowywania numerów telefonów
let phoneNumbersMap = {};
// Obiekt do przechowywania linków do stron www
let websiteLinksMap = {};
// Obiekt do przechowywania nazw miejsc z pliku Parkingilesne.kml
let excludedPlaces = new Set();
// Obiekt do przechowywania opisów i infrastruktury
let descriptionsMap = {};
let amenitiesMap = {};

// Funkcja wczytująca dane z pliku szczegóły.json
async function loadDetails() {
  try {
    const response = await fetch("/szczegoly.json");
    if (!response.ok)
      throw new Error("Nie udało się załadować pliku szczegóły.json");
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

// Funkcja do wyodrębniania numerów telefonów z tekstu opisu
function extractPhoneNumber(description) {
  const phoneRegex = /(?:Telefon:|Phone:)?\s*(\+?\d[\d\s\-()]{7,})/i;
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const descriptionWithoutUrls = description.replace(urlRegex, "");
  const match = descriptionWithoutUrls.match(phoneRegex);
  return match ? match[1].replace(/\s+/g, "") : null;
}

// Funkcja do wyodrębniania strony www z tekstu opisu
function extractWebsite(description) {
  const websiteRegex = /Website:\s*(https?:\/\/[^\s<]+)/i;
  const match = description.match(websiteRegex);
  return match ? match[1].trim() : null;
}

// Funkcja wczytująca dane z KML (numery telefonów, linki, opisy, infrastruktura)
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
      if (!response.ok)
        throw new Error(`Nie udało się załadować pliku: ${url}`);
      const kmlText = await response.text();
      const parser = new DOMParser();
      const kml = parser.parseFromString(kmlText, "application/xml");
      const placemarks = kml.getElementsByTagName("Placemark");

      for (const placemark of placemarks) {
        const name = placemark.getElementsByTagName("name")[0]?.textContent.trim();
        const description = placemark.getElementsByTagName("description")[0]?.textContent.trim();
        const website = placemark.querySelector("Data[name='website'] value")?.textContent.trim() || extractWebsite(description);
        const opis = placemark.querySelector("Data[name='Opis'] value")?.textContent.trim() || "";
        const infrastruktura = placemark.querySelector("Data[name='Udogodnienia'] value")?.textContent.trim() || "";

        if (name) {
          if (description) {
            const phone = extractPhoneNumber(description);
            phoneNumbersMap[name] = phone || "Brak numeru kontaktowego";
          }
          if (website) {
            websiteLinksMap[name] = website;
          }
          if (opis) {
            descriptionsMap[name] = opis;
          }
          if (infrastruktura) {
            amenitiesMap[name] = infrastruktura;
          }
        }
      }
    } catch (error) {
      console.error(`Błąd podczas przetwarzania pliku ${url}:`, error);
    }
  }
}

// Funkcja skracająca tekst do pierwszych 3 linii i dodająca przycisk "Pokaż więcej"
function shortenText(text, id) {
  const lines = text.split("\n");
  if (lines.length > 3) {
    const shortText = lines.slice(0, 3).join(" ") + "...";
    return `
      <span id="${id}-short">${shortText}</span>
      <span id="${id}-full" style="display:none;">${text}</span>
      <a href="#" onclick="document.getElementById('${id}-short').style.display='none';
                          document.getElementById('${id}-full').style.display='inline';
                          this.style.display='none'; 
                          return false;">
        Pokaż więcej
      </a>`;
  }
  return text;
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon) {
  let popupContent = `<strong>${name}</strong><br>`;

  // Dodanie numeru telefonu
  const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
  const phoneLink =
    phone !== "Brak numeru kontaktowego"
      ? `<a href="tel:${phone}" style="color:blue; text-decoration:none;">${phone}</a>`
      : phone;
  popupContent += `<strong>Kontakt:</strong> ${phoneLink}<br>`;

  // Dodanie strony www jako tekst (jeśli istnieje)
  if (websiteLinksMap[name]) {
    popupContent += `<strong>Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank" style="color:red; text-decoration:none;">${websiteLinksMap[name]}</a><br>`;
  }

  // Dodanie pola "Opis"
  if (descriptionsMap[name]) {
    popupContent += `<strong>Opis:</strong> ${shortenText(descriptionsMap[name], `opis-${name}`)}<br>`;
  }

  // Dodanie pola "Infrastruktura"
  if (amenitiesMap[name]) {
    popupContent += `<strong>Infrastruktura:</strong> ${shortenText(amenitiesMap[name], `infra-${name}`)}<br>`;
  }

  // Dodanie przycisku do Google Maps
  if (!excludedPlaces.has(name)) {
    const googleMapsLink = `https://www.google.com/maps/search/${encodeURIComponent(name)}`;
    popupContent += `<a href="${googleMapsLink}" target="_blank" style="display:inline-block; margin-top:5px; padding:5px 10px; border:2px solid black; color:black; text-decoration:none;">Link do Wizytówki Map Google</a><br>`;
  }

  // Dodanie przycisku "Pokaż szczegóły"
  if (detailsMap[name]) {
    popupContent += `<a href="${detailsMap[name]}" target="_blank" class="details-button">Pokaż szczegóły</a><br>`;
  } else {
    popupContent += `<a href="https://www.campteam.pl/dodaj/dodaj-zdj%C4%99cie-lub-opini%C4%99" target="_blank" class="update-button">Aktualizuj</a><br>`;
  }

  // Dodanie przycisku "Prowadź do"
  popupContent += `<a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button">Wyznacz trasę</a>`;

  return popupContent;
}

// Funkcja aktualizująca popupy dla wszystkich markerów
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon }) => {
    const popupContent = generatePopupContent(name, lat, lon);
    marker.bindPopup(popupContent);
  });
}

// Funkcja do wczytania danych i aktualizacji popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails();
  await loadKmlData();
  updatePopups(markers);
}
