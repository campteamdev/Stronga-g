console.log("✅ filters.js załadowany!");

document.addEventListener("DOMContentLoaded", function () {
    const filterButton = document.getElementById("filter-button");
    const filterPanel = document.getElementById("filter-panel");

    if (!filterButton || !filterPanel) {
        console.error("❌ Elementy filtrów nie znalezione w HTML!");
        return;
    }

    filterButton.addEventListener("click", function () {
        filterPanel.style.display = (filterPanel.style.display === "none") ? "block" : "none";

        if (filterPanel.style.display === "block") {
            hideAllMarkers();
        } else {
            showAllMarkers();
        }
    });

    document.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", applyFilters);
    });
});

// ✅ Ukrywanie wszystkich markerów
function hideAllMarkers() {
    if (!map || !markerCluster) {
        console.error("❌ Błąd: mapa lub markerCluster nie są dostępne!");
        return;
    }

    allMarkers.forEach(({ marker }) => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });

    markerCluster.clearLayers(); // Usuwamy z klastra
    console.log("🛑 Wszystkie markery ukryte!");
}

// ✅ Przywracanie wszystkich markerów
function showAllMarkers() {
    if (!map || !markerCluster) {
        console.error("❌ Błąd: mapa lub markerCluster nie są dostępne!");
        return;
    }

    allMarkers.forEach(({ marker }) => {
        if (!map.hasLayer(marker)) {
            map.addLayer(marker);
        }
        markerCluster.addLayer(marker);
    });

    console.log("📌 Przywrócono wszystkie markery!");
}

// ✅ Stosowanie filtrów
function applyFilters() {
    if (!allMarkers || allMarkers.length === 0) {
        console.error("❌ Brak markerów do filtrowania!");
        return;
    }

    const filterFiles = {
        camping: ["Kempingi.kml", "Kempingi1.kml", "Kempingiopen.kml"],
        pola: ["Polanamiotowe.kml", "Polanamiotoweopen.kml"],
        parking: ["Parkingilesne.kml"],
        biwak: ["Miejscenabiwak.kml"],
        kulturowe: ["AtrakcjeKulturowe.kml"],
        przyrodnicze: ["AtrakcjePrzyrodnicze.kml"],
        rozrywka: ["AtrakcjeRozrywka.kml"],
    };

    const activeFilters = {
        camping: document.getElementById("camping-filter")?.checked || false,
        pola: document.getElementById("pola-filter")?.checked || false,
        parking: document.getElementById("parking-filter")?.checked || false,
        biwak: document.getElementById("biwak-filter")?.checked || false,
        kulturowe: document.getElementById("kulturowe-filter")?.checked || false,
        przyrodnicze: document.getElementById("przyrodnicze-filter")?.checked || false,
        rozrywka: document.getElementById("rozrywka-filter")?.checked || false,
    };

    console.log("🎯 Aktywne filtry:", activeFilters);

    // Jeśli wszystkie filtry są wyłączone → przywróć wszystkie markery
    if (Object.values(activeFilters).every(v => !v)) {
        showAllMarkers();
        return;
    }

    hideAllMarkers(); // Usuwamy wszystkie przed zastosowaniem filtrów

    let addedMarkers = 0;
    
    allMarkers.forEach(({ marker, kmlFile }) => {
        if (!kmlFile) {
            console.warn("🚨 Brak przypisanego pliku KML do markera:", marker);
            return;
        }

        for (const [filter, files] of Object.entries(filterFiles)) {
            if (activeFilters[filter] && files.some(file => kmlFile.includes(file))) {
                if (!map.hasLayer(marker)) {
                    markerCluster.addLayer(marker);
                    map.addLayer(marker);
                    addedMarkers++;
                }
                break; // Zapobiega wielokrotnemu dodaniu markera
            }
        }
    });

    console.log(`✅ Filtry zastosowane! Dodano ${addedMarkers} markerów.`);
}
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", applyFilters);
    });
});
