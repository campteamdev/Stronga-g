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

// Funkcja generująca treść popupu z pełną blokadą kopiowania
function generatePopupContent(name, lat, lon) {
  let popupContent = `<div style="border:2px solid green; padding:3px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%;
      user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
      ${name}</div><br>`;

  // Kontener popupu z blokadą kopiowania
  popupContent += `<div style="max-width: 80%; word-wrap: break-word;
      user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">`;

  // Blokada kopiowania numeru telefonu
  const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
  const phoneLink =
    phone !== "Brak numeru kontaktowego"
      ? `<a href="tel:${phone}" style="color:blue; text-decoration:none; font-size:10px;
          user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
          ${phone}</a>`
      : `<span style="font-size:10px;
          user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
          ${phone}</span>`;

  popupContent += `<strong style="font-size:12px;
      user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
      Kontakt:</strong> ${phoneLink}<br>`;

  // Strona internetowa
  if (websiteLinksMap[name]) {
    popupContent += `<strong style="font-size:12px; user-select: none;">
        Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank"
        style="color:red; text-decoration:none; font-size:10px; user-select: none;">
        ${websiteLinksMap[name]}</a><br>`;
  }

  // Opis
  popupContent += `<div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px; user-select: none;">Opis:</div><br>`;
  popupContent += descriptionsMap[name] 
    ? `<span style="font-size:10px;
        user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
        ${descriptionsMap[name]}</span>` 
    : `<span style="font-size:10px;
        user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
        <i>Brak opisu</i></span>`;

  // Infrastruktura
  popupContent += `<br><div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px; user-select: none;">Infrastruktura:</div><br>`;
  popupContent += amenitiesMap[name] 
    ? `<span style="font-size:10px; user-select: none;">${amenitiesMap[name]}</span>` 
    : `<span style="font-size:10px; user-select: none;"><i>Brak informacji</i></span>`;

  // Linki
  popupContent += `<br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank"
        class="details-button" style="font-size:12px; user-select: none;">
        Link do Map Google</a>`;
  popupContent += `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank"
        class="navigate-button" style="font-size:12px; user-select: none;">
        Prowadź</a>`;
  popupContent += `<br><a href="https://www.campteam.pl/dodaj/dodaj-zdjecie-lub-opinie" target="_blank"
        class="update-button" style="font-size:12px; user-select: none;">
        Dodaj Zdjęcie/Aktualizuj</a>`;

  popupContent += `</div>`; // Zamknięcie kontenera popupu
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

// Blokowanie kopiowania na wszystkich urządzeniach (Windows, Mac, iPhone, Android)
document.addEventListener("copy", (event) => {
  event.preventDefault();
  alert("Kopiowanie jest zablokowane!");
});
document.addEventListener("cut", (event) => {
  event.preventDefault();
  alert("Wycinanie jest zablokowane!");
});
document.addEventListener("paste", (event) => {
  event.preventDefault();
});
document.addEventListener("selectstart", (event) => {
  event.preventDefault();
});
document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
