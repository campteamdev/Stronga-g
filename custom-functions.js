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
    console.log("✅ Załadowano szczegóły:", detailsMap);
  } catch (error) {
    console.error("❌ Błąd podczas wczytywania szczegółów:", error);
  }
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon) {
  console.log(`📍 Generowanie popupu dla: ${name}`);

  let popupContent = `
    <div style="border:2px solid #ffc107; padding:3px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%; user-select: none;">
      ${name}
    </div><br>`;

  // Przycisk "Szczegóły" (jeśli lokalizacja znajduje się w szczegoly.json)
  if (detailsMap[name]) {
    popupContent += `
      <a href="${detailsMap[name]}" target="_blank" 
        style="display:block; text-align:center; background-color:#ffc107; color:black; font-size:12px; font-weight:bold; padding:5px; 
        margin-bottom:5px; text-decoration:none; border-radius:5px;">
        Szczegóły
      </a>`;
  }

  // Numer telefonu
  const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
  popupContent += `<strong style="font-size:12px; user-select: none;">📞 Kontakt:</strong> 
    <span style="font-size:10px; user-select: none;">${phone}</span><br>`;

  // Strona internetowa
  if (websiteLinksMap[name]) {
    popupContent += `<strong style="font-size:12px; user-select: none;">🌐 Strona:</strong> 
      <a href="${websiteLinksMap[name]}" target="_blank" style="color:red; text-decoration:none; font-size:10px; user-select: none;">
        ${websiteLinksMap[name]}
      </a><br>`;
  }

  // Opis
  popupContent += `
    <div style="border:2px solid #ffc107; padding:3px; display:inline-block; font-size:12px; user-select: none; margin-top:5px;">
      📝 Opis:
    </div><br>`;
  popupContent += descriptionsMap[name] 
    ? `<span style="font-size:10px; user-select: none;">${descriptionsMap[name]}</span>`
    : `<span style="font-size:10px; user-select: none;"><i>Brak opisu</i></span>`;

  // Infrastruktura
  popupContent += `
    <br><div style="border:2px solid #ffc107; padding:3px; display:inline-block; font-size:12px; user-select: none; margin-top:5px;">
      🔧 Infrastruktura:
    </div><br>`;
  popupContent += amenitiesMap[name]
    ? `<span style="font-size:10px; user-select: none;">${amenitiesMap[name]}</span>`
    : `<span style="font-size:10px; user-select: none;"><i>Brak informacji</i></span>`;

  // Linki na dole popupu
  popupContent += `
    <br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" 
      style="display:block; background-color:#ffc107; text-align:center; color:black; font-size:12px; font-weight:bold; padding:5px; 
      text-decoration:none; border-radius:5px; margin-top:5px;">
      📍 Link do Map Google
    </a>
    <br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" 
      style="display:block; background-color:#ffc107; text-align:center; color:black; font-size:12px; font-weight:bold; padding:5px; 
      text-decoration:none; border-radius:5px; margin-top:5px;">
      🚗 Prowadź
    </a>
    <br><a href="https://www.campteam.pl/dodaj/dodaj-zdj%C4%99cie-lub-opini%C4%99" target="_blank" 
      style="display:block; background-color:#ffc107; text-align:center; color:black; font-size:12px; font-weight:bold; padding:5px; 
      text-decoration:none; border-radius:5px; margin-top:5px;">
      📸 Dodaj Zdjęcie/Aktualizuj
    </a>`;

  return popupContent;
}

// Aktualizacja popupów
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
  console.log("🔄 Rozpoczynam ładowanie danych...");
  await loadDetails();
  await loadKmlData();
  console.log("✅ Wszystkie dane załadowane, aktualizacja popupów.");
  updatePopups(markers);
}

// Blokowanie długiego dotknięcia na iPhone i Android
document.addEventListener("touchstart", function (event) {
  if (event.target.closest(".leaflet-popup-content")) {
    event.preventDefault();
  }
}, { passive: false });
