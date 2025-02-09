document.addEventListener("DOMContentLoaded", function () {
    const filterButton = document.getElementById("filter-button");
    const filterPanel = document.getElementById("filter-panel");

    // Po otwarciu panelu filtrów ukrywamy wszystkie markery
    filterButton.addEventListener("click", function () {
        filterPanel.style.display = (filterPanel.style.display === "none") ? "block" : "none";

        if (filterPanel.style.display === "block") {
            hideAllMarkers(); // Usuwamy wszystkie markery z mapy
        } else {
            showAllMarkers(); // Przywracamy wszystkie, jeśli panel się zamknie
        }
    });

    // Obsługa zmian w filtrach - działa od razu
    document.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", applyFilters);
    });
});

// ✅ Funkcja ukrywająca WSZYSTKIE markery
function hideAllMarkers() {
    if (markerCluster) {
        markerCluster.clearLayers(); // Usuwa markery z grupy
    }

    allMarkers.forEach(({ marker }) => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker); // Usuwa marker z mapy
        }
    });

    console.log("🛑 Wszystkie markery usunięte z mapy!");
}

// ✅ Funkcja PRZYWRACAJĄCA WSZYSTKIE markery
function showAllMarkers() {
    console.log("📌 Przywracanie wszystkich markerów:", allMarkers.length);
    
    allMarkers.forEach(({ marker, kmlFile }) => {
        console.log(`📍 Marker: ${marker.getLatLng()} | KML: ${kmlFile}`);
        markerCluster.addLayer(marker);
        map.addLayer(marker);
    });

    console.log("🔄 Przywrócono WSZYSTKIE markery!");
}

// ✅ Funkcja stosowania filtrów w czasie rzeczywistym
function applyFilters() {
    if (!allMarkers || allMarkers.length === 0) {
        console.error("❌ Brak markerów do filtrowania!");
        return;
    }

    // Mapa plików KML do filtrów
    const filterFiles = {
        camping: ["Kempingi.kml", "Kempingi1.kml", "Kempingiopen.kml"],
        polaNamiotowe: ["Polanamiotowe.kml", "Polanamiotoweopen.kml"],
        parkingLesne: ["Parkingilesne.kml"], // 🔹 Upewnij się, że ta nazwa jest poprawna!
        biwak: ["Miejscenabiwak.kml"],
        kulturowe: ["AtrakcjeKulturowe.kml"],
        przyrodnicze: ["AtrakcjePrzyrodnicze.kml"],
        rozrywka: ["AtrakcjeRozrywka.kml"],
    };

    // Sprawdzenie aktywnych filtrów
    const activeFilters = {
        camping: document.getElementById("camping-filter").checked,
        polaNamiotowe: document.getElementById("pola-filter").checked,
        parkingLesne: document.getElementById("parking-filter").checked,
        biwak: document.getElementById("biwak-filter").checked,
        kulturowe: document.getElementById("kulturowe-filter").checked,
        przyrodnicze: document.getElementById("przyrodnicze-filter").checked,
        rozrywka: document.getElementById("rozrywka-filter").checked,
    };

    console.log("🎯 Aktywne filtry:", activeFilters);

    // Sprawdzamy, czy WSZYSTKIE filtry są wyłączone
    const allFiltersOff = Object.values(activeFilters).every(v => !v);

    // 1️⃣ Usuwamy wszystkie markery z mapy i klastra
    hideAllMarkers();

    // 2️⃣ Jeśli WSZYSTKIE filtry są wyłączone → dodajemy WSZYSTKIE markery
    if (allFiltersOff) {
        showAllMarkers();
        return;
    }

    // 3️⃣ Dodajemy tylko markery pasujące do wybranych filtrów
    let addedMarkers = 0;
    
    allMarkers.forEach(({ marker, kmlFile }) => {
        if (!kmlFile) {
            console.warn("🚨 Brak przypisanego pliku KML do markera:", marker);
            return;
        }

        for (const [filter, files] of Object.entries(filterFiles)) {
            if (activeFilters[filter] && files.some(file => kmlFile.includes(file))) {
                console.log(`✅ Dodano marker: ${marker.getLatLng()} | Plik: ${kmlFile}`);
                markerCluster.addLayer(marker);
                map.addLayer(marker);
                addedMarkers++;
                break; // Zapobiega dodawaniu tego samego markera wielokrotnie
            }
        }
    });

    console.log(`✅ Filtry zastosowane! Dodano ${addedMarkers} markerów.`);
}
