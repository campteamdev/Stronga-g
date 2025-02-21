const CryptoJS = window.CryptoJS;



async function generateToken(filename) {
  const response = await fetch(`https://campteam-9l04l41bs-marcincamps-projects.vercel.app/api/token?filename=${filename}`);
  const data = await response.json();
  return data.token;
}





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
  const CACHE_KEY = "szczegoly_json";
  const CACHE_TIME_KEY = "szczegoly_cache_time";
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 godziny w milisekundach
  const now = Date.now();

  try {
      // 🔹 Sprawdzamy, czy mamy cache w localStorage
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cacheTime = localStorage.getItem(CACHE_TIME_KEY);

      if (cachedData && cacheTime && now - parseInt(cacheTime) < CACHE_DURATION) {
          console.log("✅ [loadDetails] Używam danych z cache.");
          detailsMap = JSON.parse(cachedData);
          return;
      }

      // 🔹 Jeśli cache jest przestarzały lub go nie ma – pobierz nową wersję
      console.log("🔄 [loadDetails] Pobieram nową wersję szczegóły.json...");
      const response = await fetch("/szczegoly.json");
      if (!response.ok) throw new Error("❌ Nie udało się załadować szczegóły.json");

      const data = await response.json();
      detailsMap = data.reduce((map, item) => {
          const [name, link] = item.split(",");
          map[name.trim()] = link.trim();
          return map;
      }, {});

      // 🔹 Zapisz do localStorage na przyszłość
      localStorage.setItem(CACHE_KEY, JSON.stringify(detailsMap));
      localStorage.setItem(CACHE_TIME_KEY, now.toString());

      console.log("✅ [loadDetails] Nowa wersja szczegóły.json zapisana w cache.");
  } catch (error) {
      console.error("❌ [loadDetails] Błąd podczas wczytywania szczegółów:", error);
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
      const kmlText = await fetchKml(filename); // ✅ Pobiera plik z API Vercel
    

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


 
  
  // Opis
  popupContent += `<div style="border:2px solidrgb(18, 161, 18); padding:4px; display:inline-block; font-size:12px;
      user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;
      border-radius: 14px; background-color: #eaffea;">
      </div><br>`;

  popupContent += descriptionsMap[name] 
    ? `<span style="font-size:12px; user-select: none;">${shortenText(descriptionsMap[name], `opis-${name}`)}</span>` 
    : `<span style="font-size:12px; user-select: none;"><i></i></span>`;

  // Strona internetowa
if (websiteLinksMap[name]) {
  let websiteUrl = websiteLinksMap[name].trim();

  // 🔹 Jeśli link NIE zaczyna się od "http://" lub "https://", dodaj "https://"
  if (!/^https?:\/\//i.test(websiteUrl)) {
      websiteUrl = "https://" + websiteUrl; // Domyślnie dodajemy HTTPS
  }

  popupContent += `<br><br>
      <a href="${websiteUrl}" target="_blank" 
         style="display: inline-block; padding: 5px 10px; border: 2px solid rgb(18, 161, 18); 
                font-size: 12px; font-weight: bold; text-decoration: none; color: black; 
                border-radius: 8px; user-select: none;">
          🌍 Strona WWW
      </a><br>`;
}


// 📌 **DODANIE PRZERWY między "Strona:" a "Infrastruktura:"**
popupContent += `<br>`;
// 🔹 Infrastruktura - tylko jeśli istnieją udogodnienia
if (amenitiesMap[name] && amenitiesMap[name].trim()) {
  let amenitiesList = amenitiesMap[name]
      .split(/[,;\n]+/)  // Podział po przecinku, średniku lub nowej linii
      .map(item => item.trim())  // Usunięcie białych znaków
      .filter(item => item !== "");  // Usunięcie pustych elementów

  // ✅ Usunięcie duplikatów
  amenitiesList = [...new Set(amenitiesList)];

  if (amenitiesList.length > 0) {
      popupContent += `<div style="border:2px solid rgb(18, 161, 18); padding:4px; display:inline-block; 
                        font-size:12px; font-weight: bold; user-select: none; border-radius: 8px;">
                        Infrastruktura:</div><br>`;

      popupContent += amenitiesList.map(amenity => 
          `<span style="display:inline-block; font-size:12px; font-weight: bold; margin-right: 6px; user-select: none;">
              ${amenity}
          </span>`).join(", ") + `<br><br>`;
  }
}

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
  await loadDetails();  // ✅ Wczytaj szczegóły (ale już nie generuj popupów!)
  await loadKmlData();  // ✅ Wczytaj KML, jeśli potrzebne

  // ✅ Teraz generujemy wszystkie popupy z wyprzedzeniem
  generateAllPopups();
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

// 🔹 Obsługa otwierania popupu i przesuwania mapy
// 🔹 Funkcja obsługująca otwarcie popupu i przesuwanie mapy
map.on("popupopen", async function (e) {
  console.log("📌 [popupopen] Otwieranie popupu...");

  const popup = e.popup._contentNode;
  if (!popup) {
      console.warn("⚠️ [popupopen] Brak elementu popupu!");
      return;
  }

  // Znalezienie wrappera popupu
  const contentWrapper = popup.closest(".leaflet-popup-content-wrapper");
  if (!contentWrapper) {
      console.warn("⚠️ [popupopen] Brak wrappera dla popupu!");
      return;
  }

  // Znalezienie treści popupu
  const popupContent = contentWrapper.querySelector(".leaflet-popup-content");
  if (!popupContent) {
      console.warn("⚠️ [popupopen] Brak zawartości popupu!");
      return;
  }

  // Dodanie strzałki przewijania, jeśli nie istnieje
  let scrollIndicator = contentWrapper.querySelector(".scroll-indicator");
  if (!scrollIndicator) {
      scrollIndicator = document.createElement("div");
      scrollIndicator.classList.add("scroll-indicator");
      contentWrapper.appendChild(scrollIndicator);
  }

  // 🔹 Sprawdzamy, czy treść wymaga przewijania
  function checkPopupScroll() {
      if (popupContent.scrollHeight > popupContent.clientHeight) {
          popupContent.classList.add("has-scroll"); // Dodajemy klasę, jeśli treść jest przewijalna
          scrollIndicator.style.opacity = "1"; // Pokazujemy strzałkę
      } else {
          popupContent.classList.remove("has-scroll"); // Usuwamy strzałkę, jeśli nie trzeba przewijać
          scrollIndicator.style.opacity = "0";
      }
  }

  // 🔹 Sprawdzamy przewijanie
  setTimeout(checkPopupScroll, 100);

  // 🔹 Ukrywamy strzałkę, gdy użytkownik przewinie na dół
  popupContent.addEventListener("scroll", function () {
      if (popupContent.scrollTop + popupContent.clientHeight >= popupContent.scrollHeight - 10) {
          scrollIndicator.style.opacity = "0"; // Strzałka znika po przewinięciu na dół
      } else {
          scrollIndicator.style.opacity = "1"; // Strzałka pojawia się ponownie
      }
  });
});


// 🔹 Funkcja przesuwająca mapę, aby lokalizacja była na dole ekranu i otwierająca popup
// 🔹 Poprawiona funkcja przesuwająca mapę przed otwarciem popupu
// 🔹 Poprawiona funkcja przesuwająca mapę i otwierająca popup
// 🔹 Poprawiona funkcja przesuwająca mapę i otwierająca popup
// 🔹 Funkcja przesuwająca mapę i otwierająca popup, powiększając ikonę
// 🔹 Poprawiona funkcja przesuwająca mapę i otwierająca popup, powiększając ikonę tylko raz
function moveMapAndOpenPopup(marker) {
  console.log("📌 [moveMapAndOpenPopup] Przesuwanie mapy i otwieranie popupu...");

  const latlng = marker.getLatLng();
  console.log(`📍 [moveMapAndOpenPopup] Współrzędne markera: ${latlng.lat}, ${latlng.lng}`);

  // Pobranie wysokości ekranu
  const mapHeight = map.getSize().y;

  // **Wykrywanie czy użytkownik jest na telefonie**
  const isMobile = window.innerWidth <= 768;

  // 🔹 Mniejsze przesunięcie na smartfonach, by ikona była widoczna
  let offsetFactor = isMobile ? 0.4 : 0.3;
  const offset = map.containerPointToLatLng([0, mapHeight * offsetFactor]).lat - map.containerPointToLatLng([0, 0]).lat;
  const newLatLng = L.latLng(latlng.lat - offset, latlng.lng);

  console.log(`🎯 [moveMapAndOpenPopup] Nowa pozycja mapy: ${newLatLng.lat}, ${newLatLng.lng}`);

  // 🔹 Przesunięcie mapy przed otwarciem popupu
  map.setView(newLatLng, map.getZoom(), { animate: true });

  // 🔹 Powiększamy ikonę markera tylko raz
  map.once("moveend", function () {
      console.log("✅ [moveMapAndOpenPopup] Mapa przesunięta, powiększanie ikony i otwieranie popupu...");

      // Jeśli marker jest już powiększony, nie zmieniaj ponownie
      if (marker._isEnlarged) return;

      // Pobranie oryginalnej ikony i zapisanie jej
      if (!marker.options.originalIcon) {
          marker.options.originalIcon = marker.options.icon;
      }

      const originalIcon = marker.options.originalIcon;
      const iconSize = originalIcon.options.iconSize;

      // Powiększona wersja ikony
      const enlargedIcon = L.icon({
          iconUrl: originalIcon.options.iconUrl,
          iconSize: [iconSize[0] * 2, iconSize[1] * 2], // 🔥 2x większa ikona
          iconAnchor: [iconSize[0], iconSize[1]], // Dopasowanie punktu zakotwiczenia
          popupAnchor: [0, -iconSize[1]] // Popup przesunięty wyżej
      });

      // Ustawienie powiększonej ikony
      marker.setIcon(enlargedIcon);
      marker._isEnlarged = true; // 🔹 Oznaczamy, że ikona jest już powiększona
      marker.openPopup();

      // 🔹 Przywracamy oryginalną ikonę po zamknięciu popupu
      marker.on("popupclose", function () {
          console.log("🔄 [popupclose] Przywracanie oryginalnej ikony...");
          resetIconSize(marker);
      });
  });
}


map.on("zoomend", function () {
  allMarkers.forEach(({ marker }) => {
      if (marker._isEnlarged) {
          resetIconSize(marker);
      }
  });
});

function resetIconSize(marker) {
  console.log("🔄 [resetIconSize] Resetowanie rozmiaru ikony po zmianie zoomu...");
  const originalIcon = marker.options.originalIcon || getOriginalIcon(marker);
  marker.setIcon(originalIcon);
  marker._isEnlarged = false; // Resetujemy flagę
}




// 🔹 Modyfikacja obsługi kliknięcia na marker
map.eachLayer(layer => {
  if (layer instanceof L.Marker) {
      console.log(`🟢 [map.eachLayer] Podpinam kliknięcie do markera na pozycji: ${layer.getLatLng().lat}, ${layer.getLatLng().lng}`);
      layer.off("click");
      layer.on("click", function () {
          moveMapAndOpenPopup(this); // ✅ Używa poprawionej funkcji
      });
  }
});


// 🔹 Funkcja otwierająca wysuwany popup
function openCustomPopup(marker) {
  console.log("📌 [openCustomPopup] Otwieranie niestandardowego popupu...");

  const latlng = marker.getLatLng();
  console.log(`📍 [openCustomPopup] Współrzędne markera: ${latlng.lat}, ${latlng.lng}`);

  const popupContent = marker.getPopup().getContent();
  if (!popupContent) {
      console.warn("⚠️ [openCustomPopup] Brak zawartości popupu!");
      return;
  }

  const name = popupContent.match(/<strong>(.*?)<\/strong>/)?.[1] || "Brak nazwy";
  console.log(`📂 [openCustomPopup] Nazwa miejsca: ${name}`);

  generatePopupContent(name, latlng.lat, latlng.lng).then(async (popupHTML) => {
      console.log("📌 [openCustomPopup] Generowanie zawartości popupu...");

      const { sliderHTML, images } = await generateImageSlider(name, latlng.lat, latlng.lng);
      showCustomPopup(popupHTML + sliderHTML);

      console.log(`📌 [openCustomPopup] Przesuwanie mapy, aby marker był nad popupem...`);
      const mapHeight = map.getSize().y;
      const offsetLat = map.containerPointToLatLng([0, mapHeight * 0.3]).lat - map.containerPointToLatLng([0, 0]).lat;
      const newLatLng = L.latLng(latlng.lat - offsetLat, latlng.lng);
      map.setView(newLatLng, map.getZoom(), { animate: true });

      console.log("✅ [openCustomPopup] Popup otwarty!");
  });
}

// 🔹 Funkcja do wyświetlenia popupu
function showCustomPopup(content) {
  console.log("📌 [showCustomPopup] Wyświetlanie wysuwanego popupu...");
  const popup = document.getElementById("custom-popup");
  document.getElementById("custom-popup-content").innerHTML = content;
  popup.style.bottom = "0";
}

// 🔹 Funkcja zamykająca popup
function closeCustomPopup() {
  console.log("📌 [closeCustomPopup] Zamknięcie wysuwanego popupu...");
  document.getElementById("custom-popup").style.bottom = "-100%";
}

// 🔹 Obsługa zamknięcia popupu
document.getElementById("close-popup").addEventListener("click", closeCustomPopup);
map.on("click", closeCustomPopup);
