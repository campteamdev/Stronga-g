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
async function fetchImages(name) {
    try {
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error('❌ Nie udało się pobrać images.json');

        const data = await response.json();

        // Normalizacja nazwy (usunięcie polskich znaków, spacje na "_")
        const formattedName = name
            .trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");

        // Sprawdzenie obu wariantów nazwy w pliku JSON
        return data[name] || data[formattedName] || [];
    } catch (error) {
        console.error("⚠️ Błąd pobierania zdjęć:", error);
        return [];
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
// Pobranie zdjęć z `images.json`
async function fetchImages(name) {
    try {
        const response = await fetch('/images.json');
        if (!response.ok) throw new Error('❌ Nie udało się pobrać images.json');

        const data = await response.json();
        console.log("📂 Załadowano images.json:", data);

        // Formatowanie nazwy (usunięcie polskich znaków, spacje na "_")
        const formattedName = name
            .trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");

        console.log("🔎 Sprawdzam klucze:", name, formattedName);

        // Sprawdzamy oba warianty nazwy w pliku JSON
        return data[name] || data[formattedName] || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}
async function generatePopupContent(name, lat, lon) {
    let sliderHTML = "";

    // Pobranie zdjęć dla danego miejsca
    const images = await fetchImages(name);
    if (images.length > 0) {
        let sliderId = `slider-${name.replace(/\s+/g, "_")}`;
        let prevButtonId = `prev-${sliderId}`;
        let nextButtonId = `next-${sliderId}`;

        sliderHTML = `
            <div class="swiper-container" id="${sliderId}">
                <div class="swiper-wrapper">
                    ${images.map(img => `
                        <div class="swiper-slide">
                            <img src="${img}" class="slider-img">
                        </div>
                    `).join("")}
                </div>
                <div class="swiper-button-prev" id="${prevButtonId}"></div>
                <div class="swiper-button-next" id="${nextButtonId}"></div>
                <div class="swiper-pagination"></div>
            </div>
        `;
    }

    let popupContent = `
        ${sliderHTML}
        <div style="border:2px solid green; padding:3px; font-size:14px; font-weight:bold; max-width:80%;">
            ${name}
        </div>
        <br>
        <div style="max-width: 80%; word-wrap: break-word;">
    `;

    // 📌 **Numer telefonu**
    const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
    const phoneLink = phone !== "Brak numeru kontaktowego"
        ? `<a href="tel:${phone}" style="color:blue; text-decoration:none; font-size:10px;">${phone}</a>`
        : `<span style="font-size:10px;">${phone}</span>`;

    popupContent += `<strong style="font-size:12px;">Kontakt:</strong> ${phoneLink}<br>`;

    // 📌 **Strona internetowa**
    if (websiteLinksMap[name]) {
        popupContent += `
            <strong style="font-size:12px;">Strona:</strong> 
            <a href="${websiteLinksMap[name]}" target="_blank" style="color:red; text-decoration:none; font-size:10px;">
                ${websiteLinksMap[name]}
            </a><br>`;
    }

    // 📌 **Opis**
    popupContent += `<div style="border:2px solid green; padding:2px; font-size:12px;">Opis:</div><br>`;
    popupContent += descriptionsMap[name]
        ? `<span style="font-size:10px;">${shortenText(descriptionsMap[name], `opis-${name}`)}</span>`
        : `<span style="font-size:10px;"><i>Brak opisu</i></span>`;

    // 📌 **Infrastruktura**
    popupContent += `<br><div style="border:2px solid green; padding:2px; font-size:12px;">Infrastruktura:</div><br>`;
    popupContent += amenitiesMap[name]
        ? `<span style="font-size:10px;">${amenitiesMap[name]}</span>`
        : `<span style="font-size:10px;"><i>Brak informacji</i></span>`;

    // 📌 **Linki**
    popupContent += `
        <br><a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button" style="font-size:12px;">Link do Map Google</a>
        <br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button" style="font-size:12px;">Prowadź</a>
        <br><a href="https://www.campteam.pl/dodaj/dodaj-zdj%C4%99cie-lub-opini%C4%99" target="_blank" class="update-button" style="font-size:12px;">Dodaj Zdjęcie/Aktualizuj</a>
    `;

    popupContent += `</div>`; // Zamknięcie kontenera popupu

    // 📌 **Poprawiona inicjalizacja Swipera**
    setTimeout(() => {
        let sliderElement = document.getElementById(sliderId);
        if (sliderElement) {
            new Swiper(`#${sliderId}`, {
                loop: true,
                pagination: { el: `#${sliderId} .swiper-pagination`, clickable: true },
                navigation: { 
                    nextEl: `#${nextButtonId}`, 
                    prevEl: `#${prevButtonId}` 
                },
                spaceBetween: 10,
                slidesPerView: 1,
                centeredSlides: true,
                autoplay: { delay: 3000 },
            });
        } else {
            console.warn("⚠️ Swiper nie został zainicjalizowany – brak elementu slidera.");
        }
    }, 500);

    return popupContent;
}

// Aktualizacja popupów z ustawioną szerokością i wysokością
async function updatePopups(markers) {
    for (const { marker, name, lat, lon } of markers) {
        const content = await generatePopupContent(name, lat, lon);
        marker.bindPopup(content, {
            minWidth: 200,  // Minimalna szerokość popupu
            maxWidth: 220,  // Maksymalna szerokość popupu
            maxHeight: 300, // Maksymalna wysokość popupu
            autoPan: true   // Automatyczne przesuwanie mapy, gdy popup wychodzi poza ekran
        });
    }
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
