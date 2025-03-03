window.activePopupMarker = null;

// ✅ Inicjalizacja grupowania markerów
const markerClusterGroup = L.markerClusterGroup({
    removeOutsideVisibleBounds: false // 🚀 Zapobiega usuwaniu markerów poza widokiem
});
markerClusterGroup.on("clusterclick", function (event) {

    event.originalEvent.preventDefault(); // Blokuje otwarcie popupu
});




window.map = L.map("map", {
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false
}).setView([52.392681, 19.275023], 6);


// ✅ Dopasowywanie folderu do nazwy
// ✅ Pobieranie listy folderów z GitHuba
async function getGitHubFolders() {
    try {
        const response = await fetch(GITHUB_REPO);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();

        const folders = data.filter(item => item.type === "dir").map(item => item.name);
      
        return folders;
    } catch (error) {
        console.error("❌ Błąd pobierania folderów:", error);
        return [];
    }
}


function sanitizeGitHubName(name) {
    return name
        .trim()
        .replace(/\s+/g, "-")  // Zamiana spacji na myślniki
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");  // Usunięcie polskich znaków
}

function restoreActivePopup() {
    if (!window.activePopupMarker) return;

    const marker = window.activePopupMarker;

    if (window.popupClosedByUser) {
        return;
    }

    if (marker.getPopup() && marker.getPopup().isOpen()) {
     
        return;
    }

    if (!map.getBounds().contains(marker.getLatLng())) {
      
        return;
    }

   
    marker.openPopup();

    window.lastOpenedPopup = {
        marker: marker,
        content: marker.getPopup().getContent()
    };
}

map.on("popupclose", function (event) {
    if (window.activePopupMarker === event.popup._source) {
      
        window.popupClosedByUser = true;

        window.lastOpenedPopup = {
            marker: window.activePopupMarker,
            content: event.popup.getContent()
        };

        window.activePopupMarker = null;
    }
});



async function findBestMatchFolder(name) {
    const folders = await getGitHubFolders();
    if (folders.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;

    folders.forEach(folder => {
        const fuzzScore = fuzzball.ratio(folder.toLowerCase(), name.toLowerCase());
        if (fuzzScore > bestScore && fuzzScore >= 85) {  // Niższy próg, aby lepiej dopasować
            bestMatch = folder;
            bestScore = fuzzScore;
        }
    });

    return bestMatch;
}
async function getLocationImages(name) {
    const cacheKey = `images_${name}`;
    const cacheTimeKey = `cache_time_${name}`;
    const now = Date.now();

    // ✅ Sprawdzanie cache (15 min)
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);
    if (cachedData && cacheTime && now - parseInt(cacheTime) < 15 * 60 * 1000) {

        return JSON.parse(cachedData);
    }

    const folder = await findBestMatchFolder(name);
    if (!folder) {
        console.warn(`⚠️ Folder dla "${name}" nie znaleziony.`);
        return [];
    }

    try {
        const response = await fetch(`${GITHUB_REPO}${encodeURIComponent(folder)}`);
        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        const images = data
            .filter(file => file.download_url && /\.(jpg|jpeg|webp)$/i.test(file.name))
            .map(file => file.download_url);

        if (images.length === 0) {
            console.warn(`⚠️ Brak zdjęć w folderze "${folder}".`);
            return [];
        }

        // ✅ Zapisujemy do cache
        localStorage.setItem(cacheKey, JSON.stringify(images));
        localStorage.setItem(cacheTimeKey, now);

        return images;
    } catch (error) {
        console.error(`❌ Błąd pobierania zdjęć z GitHuba dla "${name}":`, error);
        return [];
    }
}










// ✅ Dodanie warstwy kafelkowej OSM
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);



// ✅ Pobranie tokena dla plików KML
async function generateToken(filename) {
    try {
        const response = await fetch(`https://campteam-9l04l41bs-marcincamps-projects.vercel.app/api/token?filename=${filename}`);
        const data = await response.json();

        return data.token;
    } catch (error) {
     
        return null;
    }
}

// ✅ Pobranie pliku KML
let kmlLoadCounter = {}; // Obiekt do śledzenia liczby pobrań plików KML
const kmlCache = {}; // Cache dla plików KML
const pendingRequests = {}; // Śledzenie aktywnych zapytań

async function fetchKml(filename) {
    try {
        // ✅ Jeśli plik już jest w cache, zwracamy go bez wysyłania nowego zapytania
        if (kmlCache[filename]) {
           
            return kmlCache[filename];
        }

        // ✅ Jeśli zapytanie już trwa, czekamy na jego zakończenie zamiast wysyłać kolejne
        if (pendingRequests[filename]) {
            
            return await pendingRequests[filename];
        }


        // 🔹 Zapamiętujemy zapytanie, aby inne nie zostały wysłane równolegle
        pendingRequests[filename] = (async () => {
            const token = await generateToken(filename);
            if (!token) {
                console.error(`❌ Brak tokena, nie można pobrać ${filename}`);
                return null;
            }

            const url = `https://campteam-9l04l41bs-marcincamps-projects.vercel.app/api/kml?id=${filename}&token=${token}`;
         

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Błąd HTTP ${response.status}`);

            const data = await response.text();
            
            // ✅ Zapisujemy do cache
            kmlCache[filename] = data;

            return data;
        })();

        // ✅ Czekamy na zakończenie pobierania i usuwamy z pendingRequests
        const result = await pendingRequests[filename];
        delete pendingRequests[filename];
        return result;
    } catch (error) {
        console.error(`❌ Błąd wczytywania pliku KML (${filename}):`, error);
        delete pendingRequests[filename]; // Usuwamy zapytanie z kolejki w razie błędu
        return null;
    }
}

// ✅ Pobieranie i dodawanie markerów na mapę


async function loadMainMarkers() {
   

    // 🛠️ RESET MARKERÓW PRZED PONOWNYM WCZYTANIEM
    markerObjects = {};  
    markerNames = {};  
    markerClusterGroup.clearLayers(); // Czyścimy grupę przed ponownym dodaniem markerów

    const kmlText = await fetchKml("001.kml");
    if (!kmlText) {
        console.error("❌ Plik 001.kml nie został poprawnie pobrany.");
        return;
    }

    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, "application/xml");
    const placemarks = Array.from(kml.getElementsByTagName("Placemark"));

    if (placemarks.length === 0) {
        console.warn("⚠️ Brak placemarks w 001.kml!");
        return;
    }

    placemarks.forEach(placemark => {
        let idNode = placemark.querySelector("Data[name='id'] > value");
        let nameNode = placemark.querySelector("Data[name='name'] > value");

        let id = idNode ? idNode.textContent.trim() : `Brak ID`;
        let name = nameNode ? nameNode.textContent.trim() : `Nieznana lokalizacja`;

        let coordinatesNode = placemark.getElementsByTagName("coordinates")[0];
        const coordinates = coordinatesNode ? coordinatesNode.textContent.trim() : null;
        if (!coordinates) return;

        const [lon, lat] = coordinates.split(",");
        const marker = L.marker([lat, lon], { icon: getIconForMarker(id) });

        marker.id = id;
        marker.name = name;

        // 🛠️ POPRAWKA: Jedna normalizacja nazwy
        const normalizedKey = normalizeText(name);
        markerObjects[id.toLowerCase()] = marker;
        markerObjects[normalizedKey] = marker;
        markerNames[id] = name;

        marker.on("click", () => loadPopupData(marker, id));

        // ✅ Zamiast dodawać pojedynczo do mapy, dodajemy do grupy
    // Jeśli ID zaczyna się od K1- lub P1_, dodajemy marker bezpośrednio na mapę
    if (id.startsWith("K1_") || id.startsWith("P1_")) {
        map.addLayer(marker);

    } else {
        markerClusterGroup.addLayer(marker);
    }
    
    });

    // ✅ Dodajemy całą grupę markerów do mapy jednocześnie (dużo szybciej!)
    map.addLayer(markerClusterGroup);
   
}

function getIconForMarker(id) {
    // Domyślna ikona, jeśli brak ID
    if (!id) return L.icon({
        iconUrl: "/ikony/domyslna.png",
        iconSize: [40, 40], 
        iconAnchor: [20, 20], 
        popupAnchor: [0, -20],
    });

    // Mapa ikon z domyślnymi rozmiarami
    const iconMapping = {
        K1: { url: "/ikony/Ikona_Kempingi_Polecane.webp", defaultSize: 50 },
        P1: { url: "/ikony/Ikona_Pole_Namiotowe.webp", defaultSize: 50 },
        Ko1: { url: "/ikony/Ikona_Kempingi.webp", defaultSize: 50 },
        Po1: { url: "/ikony/Ikona_Pole_Namiotowe.webp", defaultSize: 50 },
        A1: { url: "/ikony/atractionNature.webp", defaultSize: 30 },
        Pl: { url: "/ikony/Ikona_Parking_Le%C5%9Bny.webp", defaultSize: 40 },
        Mb: { url: "/ikony/Ikona_Miejsce_Biwakowe.webp", defaultSize: 40 },
        E1: { url: "/ikony/Ikona_Kempingi.webp", defaultSize: 30 },
        Ok: { url: "/ikony/camperService.webp", defaultSize: 30 }
    };

    // Sprawdzenie, czy ID pasuje do którejś kategorii
    for (const prefix in iconMapping) {
        if (id.startsWith(prefix)) {
            const iconData = iconMapping[prefix];
            const iconSize = iconData.defaultSize; // Pobieramy rozmiar z mapy

            return L.icon({
                iconUrl: iconData.url,
                iconSize: [iconSize, iconSize], // ✅ Teraz rozmiar się zmienia
                iconAnchor: [iconSize / 2, iconSize / 2],
                popupAnchor: [0, -iconSize / 2],
            });
        }
    }

    // Jeśli ID nie pasuje do żadnej kategorii, zwracamy domyślną ikonę
    return L.icon({
        iconUrl: "/ikony/domyslna.png",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
}


// ✅ Globalny cache dla KML i zdjęć (żeby uniknąć ponownego pobierania)
if (!window.popupCache) window.popupCache = {};  
if (!window.imageCache) window.imageCache = {};  
if (!window.pendingRequests) window.pendingRequests = {};  

async function loadPopupData(marker, id) {
   

        // ✅ Resetujemy flagę zamknięcia przez użytkownika
    window.popupClosedByUser = false;
   
    // ✅ Zapisujemy marker jako aktywny
    window.activePopupMarker = marker;

    if (marker.getPopup() && marker.getPopup().isOpen()) {
       
        return;
    }
 
    marker.bindPopup("<b>Ładowanie danych...</b>");

    // ✅ Otwieramy popup dopiero po pobraniu danych
    setTimeout(() => {
        if (popupCache[id]) {
         
            marker.openPopup();
        }
    }, 500);
    

    let kmlText = popupCache[id] || null;
    let images = imageCache[id] || null;

    if (pendingRequests[id]) {
       
        await pendingRequests[id];
        return renderPopup(marker, id, popupCache[id], imageCache[id]);
    }


    pendingRequests[id] = (async () => {
        try {
            const [kmlData, imageData] = await Promise.all([
                kmlText ? Promise.resolve(kmlText) : fetchKml(`${id}.kml`),
                images ? Promise.resolve(images) : getLocationImages(id)
            ]);

            if (kmlData) popupCache[id] = kmlData;
            if (imageData) imageCache[id] = imageData;

            return { kmlData, imageData };
        } catch (error) {
            console.error(`❌ Błąd pobierania danych dla ${id}:`, error);
            return null;
        }
    })();

    const result = await pendingRequests[id];
    delete pendingRequests[id];

    if (!result || !result.kmlData) {
        marker.bindPopup("<b>Błąd ładowania danych.</b>").openPopup();
        return;
    }

    kmlText = result.kmlData;
    images = result.imageData;

    // ✅ Renderujemy popup
    renderPopup(marker, id, kmlText, images);
}

// ✅ Funkcja renderująca popup
async function renderPopup(marker, id, kmlText, images) {
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, "application/xml");
    const placemark = kml.getElementsByTagName("Placemark")[0];

    if (!placemark) {
        marker.bindPopup("<b>Błąd: Brak placemarka</b>").openPopup();
        return;
    }

    // ✅ Pobieramy nazwę
    const name = placemark.getElementsByTagName("name")[0]?.textContent || "Brak nazwy";
    const nameHTML = `
        <div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 8px;">
            ${name}
        </div>`;

    // ✅ Pobieramy opis
    let descriptionNode = placemark.querySelector("Data[name='Opis:'] > value");
    let description = descriptionNode ? descriptionNode.textContent.trim() : "";

    let descriptionHTML = description
        ? `<div style="font-size: 12px; font-weight: bold; background-color: #1f5e2f; color: white; 
                      padding: 5px; border-radius: 8px; text-align: center; margin-top: 10px;">
                Opis:
           </div>
           <p style="font-size: 12px; margin: 4px 0; text-align: center;">${description}</p>`
        : "";

    // ✅ Pobieramy numer telefonu
    let phoneNode = placemark.querySelector("Data[name='Telefon:'] > value") 
                 || placemark.querySelector("Data[name='phone'] > value");
    let phoneNumber = phoneNode ? phoneNode.textContent.trim() : null;
    
    

    // ✅ Pobieramy udogodnienia
    let amenitiesNode = placemark.querySelector("Data[name='Udogodnienia:'] > value");
    let amenitiesText = amenitiesNode ? amenitiesNode.textContent.trim() : "";

    if (amenitiesText) {
        amenitiesText = amenitiesText
            .replace(/\(nr\s*\d+\)/g, "")  // Usuwamy "(nr X)" np. "(nr 5)"
            .replace(/\s{2,}/g, " ")       // Usuwamy podwójne spacje
            .trim();
    }

    // ✅ Lista typowych fraz udogodnień
    const knownAmenities = [
        "Toalety", "Prysznice", "Dostęp do prądu", "Dostęp do wody",
        "Obsługa kampera", "Plac zabaw dla dzieci", "Przyjazne dla zwierząt",
        "Bar/Restauracja", "Altana", "Miejsce na ognisko", "Grill",
        "Hamaki", "Stół piknikowy", "Pralnia", "Zarybiony staw",
        "Jacuzzi", "Sauna", "Kuchnia", "Parking", "Wi-Fi", "Sklep",
        "Basen", "Wypożyczalnia rowerów"
    ];

    let amenitiesList = [];
    let lines = amenitiesText.split(/\n/); 

    lines.forEach(line => {
        let cleaned = line.trim();
        if (cleaned && knownAmenities.some(amenity => cleaned.includes(amenity))) {
            amenitiesList.push(cleaned);
        }
    });

    let amenitiesHTML = amenitiesList.length > 0
        ? `<div style="font-size: 12px; font-weight: bold; background-color: #1f5e2f; color: white; 
                      padding: 5px; border-radius: 8px; text-align: center; margin-top: 10px;">
                Udogodnienia:
           </div>
           <p style="font-size: 12px; margin: 4px 0; text-align: center;">
               ${amenitiesList.map(item => `• ${item}`).join("<br>")}
           </p>`
        : "";

    // ✅ Pobieramy zdjęcia i przekazujemy numer telefonu
    const { sliderHTML, images: finalImages } = await generateImageSlider(
        name, 
        marker.getLatLng().lat, 
        marker.getLatLng().lng, 
        phoneNumber
    );

    // ✅ Tworzymy treść popupu
    const popupContent = `
        <div style="max-width: 300px;">
            ${nameHTML}
            ${sliderHTML}
            ${descriptionHTML}
            ${amenitiesHTML}
        </div>`;

    // ✅ Ustawienie treści popupu
    marker.bindPopup(popupContent, { autoPan: true, minWidth: 200 }).openPopup();

    // ✅ Inicjalizacja Swiper.js, jeśli są zdjęcia
    if (finalImages.length > 0) {
        setTimeout(() => {
            initializeSwiper(name, finalImages);
        }, 300);
    }
}


// ✅ Inicjalizacja mapy
async function initializeMap() {
    

    document.getElementById("loading-screen").style.display = "flex";

    await loadMainMarkers();

    document.getElementById("loading-screen").style.opacity = "0";
    setTimeout(() => {
        document.getElementById("loading-screen").style.display = "none";
    }, 500);

   
}
document.body.addEventListener("click", function (event) {
    const clickedElement = event.target.closest(".open-photo-form, .open-photo-form img");

    if (clickedElement) {
        event.preventDefault();
        event.stopPropagation();

        console.log("🟢 Kliknięto ikonę 'Dodaj zdjęcie'. Otwieram popup...");

        const photoFormPopup = document.getElementById("photo-form-popup");
        const zohoIframe = document.getElementById("zoho-iframe");

        if (!photoFormPopup || !zohoIframe) {
            console.error("❌ Błąd: Popup lub iframe nie istnieją!");
            return;
        }

        // ✅ Dodajemy klasę `active`, żeby pokazać popup
        photoFormPopup.classList.add("active");

        // ✅ Ustawiamy `src` dla iframe tylko jeśli jest pusty lub nie załadowany
        if (!zohoIframe.src || zohoIframe.src.trim() === "") {
            console.log("🔹 iframe src jest pusty, ustawiam URL...");
            zohoIframe.src = "https://forms.zohopublic.eu/campteamdevgm1/form/Dodaniezdjcia/formperma/LqnbyLFmsQpeQlMXegiuEMKOOeG20xkBIcJKtmKnXCE";
            console.log("✅ `iframe` src ustawione!");
        } else {
            console.log("ℹ️ `iframe` src już ustawione, nie zmieniam.");
        }
    }
});

// 🔹 Zamknięcie popupu po kliknięciu "X"
document.getElementById("close-photo-popup").addEventListener("click", function () {
    console.log("❌ Zamykam popup...");
    const photoFormPopup = document.getElementById("photo-form-popup");
    if (photoFormPopup) {
        photoFormPopup.classList.remove("active");
    }
});



document.addEventListener("DOMContentLoaded", async () => {
    try {
       
        await loadMainMarkers();
        initializeSearch();  // Funkcja z filters.js
       
    } catch (error) {
        console.error("❌ Błąd inicjalizacji:", error);
    }
    initializeMap();
});

