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

// Funkcja wczytująca dane z JSON
async function loadJsonData() {
  const jsonFiles = [
    "/AtrakcjeKultorowe.json",
    "/Kempingi.json",
    "/Kempingi1.json",
    "/Kempingiopen.json",
    "/Miejscenabiwak.json",
    "/Parkingilesne.json",
    "/Polanamiotowe.json",
    "/Polanamiotoweopen.json",
  ];

  for (const url of jsonFiles) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Nie udało się załadować: ${url}`);
      const data = await response.json();

      data.places.forEach((place) => {
        const { name, lat, lon, description } = place;

        if (name) {
          if (description) {
            const phone = extractPhoneNumber(description);
            phoneNumbersMap[name] = phone || "Brak numeru kontaktowego";
            const website = extractWebsite(description);
            websiteLinksMap[name] = website || "";
          }
          descriptionsMap[name] = description || "Brak opisu";
          amenitiesMap[name] = "Brak informacji"; // JSON nie zawiera infrastruktury, ale można dodać, jeśli jest w danych
        }
      });
    } catch (error) {
      console.error(`Błąd podczas przetwarzania pliku ${url}:`, error);
    }
  }
}

// Funkcja do wyodrębniania numerów telefonów
function extractPhoneNumber(description) {
  const phoneRegex = /(?:Telefon:|Phone:)?\s*(\+?\d[\d\s\-()]{7,})/i;
  const match = description.match(phoneRegex);
  return match ? match[1].replace(/\s+/g, "") : null;
}

// Funkcja do wyodrębniania strony www
function extractWebsite(description) {
  const websiteRegex = /Website:\s*(https?:\/\/[^\s<]+)/i;
  const match = description.match(websiteRegex);
  return match ? match[1].trim() : null;
}

// Funkcja skracająca tekst do 3 linijek
function shortenText(text, id) {
  if (!text) return "";
  const words = text.split(" ");
  if (words.length > 30) {
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
  let popupContent = `<div style="border:2px solid green; padding:3px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%;
      user-select: none;">
      ${name}</div><br>`;

  // Kontener popupu z blokadą kopiowania
  popupContent += `<div style="max-width: 80%; word-wrap: break-word;">`;

  // Blokada kopiowania numeru telefonu
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

  // Opis
  popupContent += `<div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px;">Opis:</div><br>`;
  popupContent += descriptionsMap[name]
    ? `<span style="font-size:10px;">${shortenText(descriptionsMap[name], `opis-${name}`)}</span>`
    : `<span style="font-size:10px;"><i>Brak opisu</i></span>`;

  // Infrastruktura
  popupContent += `<br><div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px;">Infrastruktura:</div><br>`;
  popupContent += amenitiesMap[name]
    ? `<span style="font-size:10px;">${amenitiesMap[name]}</span>`
    : `<span style="font-size:10px;"><i>Brak informacji</i></span>`;

  // Linki
  popupContent += `<br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button" style="font-size:12px;">Link do Map Google</a>`;
  popupContent += `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button" style="font-size:12px;">Prowadź</a>`;
  popupContent += `<br><a href="https://www.campteam.pl/dodaj/dodaj-zdj%C4%99cie-lub-opini%C4%99" target="_blank" class="update-button" style="font-size:12px;">Dodaj Zdjęcię/Aktualizuj</a>`;

  popupContent += `</div>`; // Zamknięcie kontenera popupu
  return popupContent;
}

// Aktualizacja popupów z ustawioną szerokością i wysokością
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon }) => {
    const popupContent = generatePopupContent(name, lat, lon);
    marker.bindPopup(popupContent, {
      minWidth: 200,
      maxWidth: 220,
      maxHeight: 300,
      autoPan: true
    });
  });
}

// Ładowanie danych i aktualizacja popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails();
  await loadJsonData();
  updatePopups(markers);
}
