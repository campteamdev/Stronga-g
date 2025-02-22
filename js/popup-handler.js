const popupCache = {}; // Pamięć podręczna dla gotowych popupów

async function generateAllPopups() {
    for (const { marker, name, lat, lon } of allMarkers) {
        if (!popupCache[name]) {
            // ✅ Generujemy treść popupu i zapisujemy w cache
            popupCache[name] = generatePopupContent(name, lat, lon);
        }

        // ✅ Przypisujemy gotowy popup do markera (zamiast generować go dynamicznie)
        marker.bindPopup(popupCache[name], { autoPan: true, minWidth: 200 });
    }
}

// 🔹 Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon) {
    let popupContent = `<div style="border:2px solid transparent; padding:5px; display:inline-block; font-size:14px; font-weight:bold; max-width:80%;
    user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;
    border-radius: 8px; background-color: transparent; color: transparent;">
    ${name}
  </div><br>`;

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
    popupContent += `<div style="border:2px solid rgb(31, 235, 31); padding:4px; display:inline-block; font-size:12px;
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

// 🔹 Obsługa otwierania popupu i przesuwania mapy
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

    // 🔹 Obsługa zdarzenia "popupopen" – powiększenie ikony dopiero, gdy popup się otworzy
    marker.on("popupopen", function () {
        console.log("✅ [popupopen] Popup otwarty, powiększanie ikony...");

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
    });

    // 🔹 Przywracamy oryginalną ikonę po zamknięciu popupu
    marker.on("popupclose", function () {
        console.log("🔄 [popupclose] Przywracanie oryginalnej ikony...");
        resetIconSize(marker);
    });

    // 🔹 Otwieramy popup – ikona powiększy się dopiero po otwarciu
    marker.openPopup();
}

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
});
