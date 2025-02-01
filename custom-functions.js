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

      if (infrastruktura) {
  // Usunięcie wzorca "nr: X", także z różnymi spacjami
  infrastruktura = infrastruktura.replace(/\s*-?\s*nr:?\s*\d+/gi, "").trim();
  
  // Każda linia w nowej linii HTML
  infrastruktura = infrastruktura.replace(/\n/g, "<br>");
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

function generatePopupContent(name, lat, lon) {
  // Formatowanie nazwy do użycia w ścieżkach zdjęć (usuwa spacje i polskie znaki)
  const formattedName = name.replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const images = [1, 2, 3].map(num => `/foty/${formattedName}_${num}.jpg`);

  // Sprawdzamy, czy zdjęcia faktycznie istnieją
  let validImages = [];
  images.forEach((img, index) => {
    let testImg = new Image();
    testImg.src = img;
    testImg.onload = () => { validImages.push(img); };
  });

  let popupContent = "";

  // Dodajemy slider TYLKO jeśli istnieją zdjęcia
  if (validImages.length > 0) {
    popupContent += `
      <div class="swiper-container" style="width:200px; height:150px;">
        <div class="swiper-wrapper">
          ${validImages.map(img => `
            <div class="swiper-slide">
              <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
            </div>
          `).join("")}
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
      </div>
    `;
  }

  // Dodanie nazwy miejsca
  popupContent += `
    <div style="border:2px solid green; padding:3px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%; user-select: none;">
      ${name}
    </div><br>
  `;

  // Numer telefonu
  const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
  popupContent += `<strong>Kontakt:</strong> ${phone}<br>`;

  // Strona internetowa
  if (websiteLinksMap[name]) {
    popupContent += `<strong>Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank">${websiteLinksMap[name]}</a><br>`;
  }

  // Opis
  popupContent += `<strong>Opis:</strong> ${descriptionsMap[name] ? shortenText(descriptionsMap[name], `opis-${name}`) : "<i>Brak opisu</i>"}<br>`;

  // Infrastruktura
  popupContent += `<strong>Infrastruktura:</strong> ${amenitiesMap[name] || "<i>Brak informacji</i>"}<br>`;

  // Linki do Google Maps
  popupContent += `
    <br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank">Link do Map Google</a>
    <br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank">Prowadź</a>
  `;

  return popupContent;
}


// Aktualizacja popupów z ustawioną szerokością i wysokością
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon }) => {
    const popupContent = generatePopupContent(name, lat, lon);
    marker.bindPopup(popupContent, {
      minWidth: 200,  // Minimalna szerokość popupu
      maxWidth: 220,  // Maksymalna szerokość popupu
      maxHeight: 300, // Maksymalna wysokość popupu
      autoPan: true   // Automatyczne przesuwanie mapy, gdy popup wychodzi poza ekran
    });
  });
}

// Ładowanie danych i aktualizacja popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails();
  await loadKmlData();
  updatePopups(markers);
}
document.addEventListener("touchstart", function (event) {
  if (event.target.closest(".leaflet-popup-content")) {
    event.preventDefault();
  }
}, { passive: false });
