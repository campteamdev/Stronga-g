// Obiekty do przechowywania danych
let detailsMap = {};
let phoneNumbersMap = {};
let websiteLinksMap = {};
let descriptionsMap = {};
let amenitiesMap = {};
let excludedPlaces = new Set();

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
          infrastruktura = infrastruktura.replace(/- nr:?\s*\d+/g, "").trim();
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

// Funkcja skracająca tekst do pierwszych 3 linii
function shortenText(text, id) {
  if (!text) return ""; // Jeśli brak treści, zwróć pusty ciąg
  const lines = text.split("\n");
  if (lines.length > 3) {
    const shortText = lines.slice(0, 3).join(" ") + "...";
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

// Funkcja generująca treść popupu z zieloną ramką i poprawioną infrastrukturą
function generatePopupContent(name, lat, lon) {
  let popupContent = `<div style="border:2px solid green; padding:5px; display:inline-block; font-size:16px; font-weight:bold;">${name}</div><br>`;

  // Numer telefonu
  const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
  const phoneLink =
    phone !== "Brak numeru kontaktowego"
      ? `<a href="tel:${phone}" style="color:blue; text-decoration:none; font-size:10px;">${phone}</a>`
      : `<span style="font-size:10px;">${phone}</span>`;
  popupContent += `<strong style="font-size:12px;">Kontakt:</strong> ${phoneLink}<br>`;

  // Strona internetowa
  if (websiteLinksMap[name]) {
    popupContent += `<strong style="font-size:12px;">Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank" style="color:red; text-decoration:none; font-size:10px;">${websiteLinksMap[name]}</a><br>`;
  }

  // Opis (napis zawsze widoczny, dane tylko jeśli istnieją)
  popupContent += `<div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px;">Opis:</div><br>`;
  popupContent += descriptionsMap[name] 
    ? `<span style="font-size:10px;">${shortenText(descriptionsMap[name], `opis-${name}`)}</span>` 
    : `<span style="font-size:10px;"><i>Brak opisu</i></span>`;

  // Infrastruktura (napis zawsze widoczny, dane tylko jeśli istnieją)
  popupContent += `<br><div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px;">Infrastruktura:</div><br>`;
  popupContent += amenitiesMap[name] 
    ? `<span style="font-size:10px;">${shortenText(amenitiesMap[name].replace(/\s*-\s*/g, "<br>"), `infra-${name}`)}</span>` 
    : `<span style="font-size:10px;"><i>Brak informacji</i></span>`;

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
