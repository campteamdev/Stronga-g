
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
  if (!description) return null;  // 🔴 Dodana obsługa błędu dla `undefined`
  const websiteRegex = /Website:\s*(https?:\/\/[^\s<]+)/i;
  const match = description.match(websiteRegex);
  return match ? match[1].trim() : null;
}


// Funkcja wczytująca dane z KML
async function loadKmlData() {
  const kmlFiles = [
    "Kempingi.kml",
    "Polanamiotowe.kml",
    "Kempingiopen.kml",
    "Polanamiotoweopen.kml",
    "Parkingilesne.kml",
    "Kempingi1.kml",
    "AtrakcjeKulturowe.kml",
    "AtrakcjePrzyrodnicze.kml",
    "AtrakcjeRozrywka.kml",
    "Miejscenabiwak.kml",
    "Europa.kml",
  ];

  for (const filename of kmlFiles) {
    try {
      const url = getKML(filename); // Pobiera zakodowany URL
      console.log(`🔍 Ładowanie KML: ${filename} -> ${url}`); // Debug

      const response = await fetch(url);
      if (!response.ok) throw new Error(`❌ Nie udało się załadować: ${filename}`);

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

        // Usunięcie zbędnych znaków z infrastruktury
        if (infrastruktura) {
          infrastruktura = infrastruktura
            .replace(/-?\s*(nr[:.]?|[0-9]+|\(|\)|\[|\])/g, "") // Usuwa "nr:", "nr.", cyfry, nawiasy
            .trim()
            .replace(/\s{2,}/g, " "); // Usuwa nadmiarowe spacje
          infrastruktura = infrastruktura.split("\n").join("<br>"); // Formatowanie HTML
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
      console.error(`❌ Błąd podczas przetwarzania pliku ${filename}:`, error);
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

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon) {
  let popupContent = `<div style="border:2px solid transparent; padding:5px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%;
  user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;
  border-radius: 8px; background-color: transparent; color: transparent;">
  ${name}
</div><br>`;


// Funkcja generująca treść popupu z pełną blokadą kopiowania
function generatePopupContent(name, lat, lon) {
 
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

  // Blokada kopiowania opisu
 popupContent += `<div style="border:2px solidrgb(31, 235, 31); padding:4px; display:inline-block; font-size:12px;
      user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;
      border-radius: 8px; background-color: #eaffea;">
      Opis:</div><br>`;

  popupContent += descriptionsMap[name] 
    ? `<span style="font-size:10px;
        user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
        ${shortenText(descriptionsMap[name], `opis-${name}`)}</span>` 
    : `<span style="font-size:10px;
        user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
        <i>Brak opisu</i></span>`;

  popupContent += `</div>`; // Zamknięcie kontenera popupu
  return popupContent;
}


 
  // Strona internetowa
  if (websiteLinksMap[name]) {
    popupContent += `<strong style="font-size:12px; user-select: none;">Strona:</strong> <a href="${websiteLinksMap[name]}" target="_blank" style="color:red; text-decoration:none; font-size:10px; user-select: none;">${websiteLinksMap[name]}</a><br>`;
  }

  // Opis
  popupContent += `<div style="border:2px solidrgb(18, 161, 18); padding:4px; display:inline-block; font-size:12px;
      user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;
      border-radius: 8px; background-color: #eaffea;">
      Opis:</div><br>`;

  popupContent += descriptionsMap[name] 
    ? `<span style="font-size:10px; user-select: none;">${shortenText(descriptionsMap[name], `opis-${name}`)}</span>` 
    : `<span style="font-size:10px; user-select: none;"><i>Brak opisu</i></span>`;

  // Infrastruktura
  popupContent += `<br><div style="border:2px solidrgb(184, 19, 25); padding:4px; display:inline-block; font-size:12px; 
      user-select: none; border-radius: 8px; background-color: #eaffea;">
      Infrastruktura:</div><br>`;

  popupContent += amenitiesMap[name] 
    ? `<span style="font-size:10px; user-select: none;">${amenitiesMap[name]}</span>` 
    : `<span style="font-size:10px; user-select: none;"><i>Brak informacji</i></span>`;

  // Linki
  popupContent += `<br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button" style="font-size:12px; user-select: none;">Link do Map Google</a>`;
  

  popupContent += `</div>`; // Zamknięcie kontenera popupu
  return popupContent;
}

// Aktualizacja popupów z ustawioną szerokością i wysokością
// 🔹 Aktualizacja popupów z dynamiczną szerokością i wysokością na smartfonach
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon }) => {
      const popupContent = generatePopupContent(name, lat, lon);

      // Wykrywanie, czy użytkownik korzysta z telefonu
      const isMobile = window.innerWidth <= 768;

      const popupOptions = {
          minWidth: 200, // Minimalna szerokość dla obu urządzeń
          maxWidth: isMobile ? window.innerWidth * 0.7 : 260, // 90% szerokości ekranu na telefonie, 260px na komputerze
          maxHeight: isMobile ? window.innerHeight * 0.5 : 350, // 50% wysokości ekranu na telefonie, 350px na komputerze
          autoPan: true,
          closeButton: true, // Przyciski zamykania poprawione
          className: isMobile ? "mobile-popup" : "desktop-popup" // Dodajemy różne style
      };

      marker.bindPopup(popupContent, popupOptions);
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
// 🔹 Modyfikujemy popupy, aby dodawać zdjęcia
async function updatePopupsWithImages() {
    const popups = document.querySelectorAll(".leaflet-popup-content");

    for (const popup of popups) {
        const name = popup.querySelector("div").textContent.trim(); // Pobranie nazwy lokalizacji
        const imageSlider = await generateImageSlider(name);

        if (imageSlider) {
            popup.insertAdjacentHTML("afterbegin", imageSlider);
        }
    }
}

// 🔹 Dodajemy wywołanie funkcji po otwarciu popupu
// 🔹 Dodajemy wywołanie funkcji po otwarciu popupu
map.on("popupopen", async function (e) {
  setTimeout(async () => {
      const popup = e.popup._contentNode;
      const nameElement = popup.querySelector("div");
      if (!nameElement) return;

      const name = nameElement.textContent.trim();
      const lat = e.popup._source.getLatLng().lat;
      const lon = e.popup._source.getLatLng().lng;

      console.log(`📂 🔍 Otwieranie popupu dla: ${name}`);

      // 🔹 Sprawdzenie, czy zdjęcia już zostały dodane
      if (popup.querySelector(".swiper-container")) {
          console.log(`📂 ⏳ Slider dla ${name} już istnieje. Pomijam ponowne ładowanie.`);
          return;
      }

      // 🔹 Pobieramy i dodajemy zdjęcia
      const { sliderHTML, images } = await generateImageSlider(name, lat, lon);

      if (sliderHTML) {
          popup.insertAdjacentHTML("afterbegin", sliderHTML);
          initializeSwiper(name, images);
      }
  }, 300);
});


// 🔹 Dodajemy obsługę przesuwania popupu zamiast mapy na telefonach
document.addEventListener("touchmove", function (event) {
if (event.target.closest(".leaflet-popup-content")) {
  event.stopPropagation(); // Pozwala przesuwać popup zamiast mapy
}
}, { passive: false });


