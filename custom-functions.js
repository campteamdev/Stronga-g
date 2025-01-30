// Obiekty do przechowywania danych
let detailsMap = {};
let locationsData = {};

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

// Funkcja do ekstrakcji danych z Placemark
function extractDataFromPlacemark(placemark) {
  const name = placemark.getElementsByTagName("name")[0]?.textContent.trim() || "Brak nazwy";
  const description = placemark.getElementsByTagName("description")[0]?.textContent.trim() || "";
  const website = placemark.querySelector("Data[name='Strona www:'] > value")?.textContent.trim() || extractWebsite(description);
  const phone = extractPhoneNumber(description);
  const opis = placemark.querySelector("Data[name='Opis:'] > value")?.textContent.trim() || "";
  let infrastruktura = placemark.querySelector("Data[name='Udogodnienia:'] > value")?.textContent.trim() || "";

  // Usunięcie "nr: X" z infrastruktury
  if (infrastruktura) {
    infrastruktura = infrastruktura.replace(/- nr:? \d+/g, "").trim();
    infrastruktura = infrastruktura.split("\n").join("<br>"); // Każdy element w nowej linii
  }

  return { name, description, website, phone, opis, infrastruktura };
}

// Funkcja do wyodrębniania numerów telefonów
function extractPhoneNumber(description) {
  const phoneRegex = /(?:Telefon:|Phone:)?\s*(\+?\d[\d\s\-()]{7,})/i;
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const match = description.replace(urlRegex, "").match(phoneRegex);
  return match ? match[1].replace(/\s+/g, "") : "Brak numeru kontaktowego";
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
        const data = extractDataFromPlacemark(placemark);
        locationsData[data.name] = data;
      }
    } catch (error) {
      console.error(`Błąd podczas przetwarzania pliku ${url}:`, error);
    }
  }
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon) {
  const data = locationsData[name] || {};
  let popupContent = `<div style="border:2px solid green; padding:3px; font-size:14px; font-weight:bold; user-select: none;">${name}</div><br>`;

  popupContent += `<div style="word-wrap: break-word; user-select: none;">`;

  popupContent += `<strong style="font-size:12px;">Kontakt:</strong> ${data.phone ? `<a href="tel:${data.phone}" style="color:blue; text-decoration:none; font-size:10px;">${data.phone}</a>` : "Brak numeru"}<br>`;

  if (data.website) {
    popupContent += `<strong style="font-size:12px;">Strona:</strong> <a href="${data.website}" target="_blank" style="color:red; text-decoration:none; font-size:10px;">${data.website}</a><br>`;
  }

  popupContent += `<div style="border:2px solid green; padding:2px; font-size:12px;">Opis:</div><br>`;
  popupContent += data.opis ? `<span style="font-size:10px;">${shortenText(data.opis, `opis-${name}`)}</span>` : `<span style="font-size:10px;"><i>Brak opisu</i></span>`;

  popupContent += `<br><div style="border:2px solid green; padding:2px; font-size:12px;">Infrastruktura:</div><br>`;
  popupContent += data.infrastruktura ? `<span style="font-size:10px;">${data.infrastruktura}</span>` : `<span style="font-size:10px;"><i>Brak informacji</i></span>`;

  popupContent += `<br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button" style="font-size:12px;">Link do Map Google</a>`;
  popupContent += `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button" style="font-size:12px;">Prowadź</a>`;
  popupContent += `<br><a href="https://www.campteam.pl/dodaj/dodaj-zdjecie-lub-opinie" target="_blank" class="update-button" style="font-size:12px;">Aktualizuj</a>`;

  popupContent += `</div>`;
  return popupContent;
}

// Aktualizacja popupów
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon }) => {
    const popupContent = generatePopupContent(name, lat, lon);
    marker.bindPopup(popupContent);
  });
}

// Ładowanie danych i aktualizacja popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails();
  await loadKmlData();
  updatePopups(markers);
}
