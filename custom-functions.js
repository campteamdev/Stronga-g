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
  console.log(`📸 Sprawdzam slider dla: ${name}`);
console.log(document.getElementById(`slider-${name.replace(/\s/g, '_')}`));
 
  let popupContent = `
        <div class="slider-container">
            <button class="slider-prev" onclick="prevSlide(event)">&#10094;</button>
           <div class="slider-images" id="slider-${name}"></div>

            <button class="slider-next" onclick="nextSlide(event)">&#10095;</button>
        </div>
        <br>
        <div style="border:2px solid green; padding:3px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%; user-select: none;">
            ${name}
        </div><br>
    `;

    // Kontener popupu z blokadą kopiowania
    popupContent += `<div style="max-width: 80%; word-wrap: break-word;
        user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">`;

    // Blokada kopiowania numeru telefonu
    const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
    const phoneLink = phone !== "Brak numeru kontaktowego"
        ? `<a href="tel:${phone}" style="color:blue; text-decoration:none; font-size:10px;
            user-select: none;">${phone}</a>`
        : `<span style="font-size:10px; user-select: none;">${phone}</span>`;

    popupContent += `<strong style="font-size:12px; user-select: none;">Kontakt:</strong> ${phoneLink}<br>`;

    // Strona internetowa
    if (websiteLinksMap[name]) {
        popupContent += `<strong style="font-size:12px; user-select: none;">Strona:</strong> 
        <a href="${websiteLinksMap[name]}" target="_blank" style="color:red; text-decoration:none; font-size:10px; user-select: none;">
        ${websiteLinksMap[name]}</a><br>`;
    }

    // Opis
    popupContent += `<div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px; user-select: none;">Opis:</div><br>`;
    popupContent += descriptionsMap[name] 
        ? `<span style="font-size:10px; user-select: none;">${shortenText(descriptionsMap[name], `opis-${name}`)}</span>` 
        : `<span style="font-size:10px; user-select: none;"><i>Brak opisu</i></span>`;

    // Infrastruktura
    popupContent += `<br><div style="border:2px solid green; padding:2px; display:inline-block; font-size:12px; user-select: none;">Infrastruktura:</div><br>`;
    popupContent += amenitiesMap[name] 
        ? `<span style="font-size:10px; user-select: none;">${amenitiesMap[name]}</span>` 
        : `<span style="font-size:10px; user-select: none;"><i>Brak informacji</i></span>`;

    // Linki
    popupContent += `<br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button" style="font-size:12px; user-select: none;">Link do Map Google</a>`;
    popupContent += `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button" style="font-size:12px; user-select: none;">Prowadź</a>`;
    popupContent += `<br><a href="https://www.campteam.pl/dodaj/dodaj-zdj%C4%99cie-lub-opini%C4%99" target="_blank" class="update-button" style="font-size:12px; user-select: none;">Dodaj Zdjęcię/Aktualizuj</a>`;

    popupContent += `</div>`; // Zamknięcie kontenera popupu

    // Opóźnione ładowanie zdjęć do slidera
    setTimeout(() => {
        if (document.getElementById(`slider-${name.replace(/\s/g, '_')}`)) {
            loadImagesForSlider(name);
        }
    }, 300);

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
async function loadImagesForSlider(name) {
    try {
        console.log(`🔍 Próba załadowania zdjęć dla: ${name}`);

        const response = await fetch('/images.json');
        if (!response.ok) throw new Error("Błąd ładowania images.json");
        const imagesData = await response.json();

        const formattedName = name.replace(/\s/g, '_'); // Zamiana spacji na _
        console.log(`📂 Oczekiwany klucz w images.json: ${formattedName}`, imagesData);

   const sliderContainer = document.getElementById(`slider-${formattedName}`);
if (!sliderContainer) {
    console.warn(`⚠️ Nie znaleziono slidera: slider-${formattedName}`);
    return;
}

        }
if (!sliderContainer) {
    console.warn(`⚠️ Nie znaleziono elementu: slider-${formattedName}`);
    return;
}

        // Czyszczenie starej zawartości
        sliderContainer.innerHTML = ""; 

        // Pobieranie zdjęć - sprawdzamy różne wersje kluczy
        const images = imagesData[formattedName] || imagesData[name] || [];
        
        if (images.length === 0) {
            console.warn(`⚠️ Brak zdjęć w images.json dla: ${formattedName}`);
            return;
        }

        images.forEach((imageSrc, index) => {
            const imgElement = document.createElement("img");
            imgElement.src = imageSrc;
            imgElement.classList.add("slider-image");
            imgElement.style.display = index === 0 ? "block" : "none"; // Pokazuj tylko 1 obrazek

            // Obsługa kliknięcia – otwieranie w popupie
            imgElement.addEventListener("click", function () {
                openPopup(this.src);
            });

            sliderContainer.appendChild(imgElement);
        });

        sliderContainer.dataset.currentIndex = 0;
        sliderContainer.dataset.loaded = "true";

        console.log(`✅ Załadowano ${images.length} zdjęć dla ${formattedName}`);
    } catch (error) {
        console.error("❌ Błąd ładowania zdjęć:", error);
    }
}


// Funkcja otwierająca popup
function openPopup(imageSrc) {
    let popup = document.getElementById("imagePopup");
    let popupImg = document.getElementById("popupImage");

    if (!imageSrc || imageSrc.trim() === "") {
        console.warn("⚠️ Błąd: Brak poprawnego linku do zdjęcia!");
        return;
    }

    popupImg.src = imageSrc;
    popup.style.display = "flex";
}

// Funkcja zamykająca popup
function closePopup() {
    document.getElementById("imagePopup").style.display = "none";
}

// Dodanie obsługi kliknięcia na slider
document.body.addEventListener("click", function (event) {
    if (event.target.classList.contains("slider-image")) {
        openPopup(event.target.src);
    }
});
