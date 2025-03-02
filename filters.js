// ✅ Globalna funkcja normalizująca tekst – teraz dostępna wszędzie
function normalizeText(text) {
    if (!text) return "";
    return text
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "");
}

// ✅ Inicjalizacja wyszukiwarki z podpowiedziami
function initializeSearch() {
    console.log("🔍 [initializeSearch] Uruchamianie...");
    
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const suggestions = document.getElementById("suggestions");

    searchInput.addEventListener("input", () => {
        const query = normalizeText(searchInput.value.trim());
        suggestions.innerHTML = ""; 

        if (!query) {
            suggestions.style.display = "none";
            return;
        }

        let matches = [];

        console.log("🔎 [input] Szukam dla:", query);
        console.log("🔎 markerNames:", markerNames);

        for (const [id, name] of Object.entries(markerNames)) {
            const normalizedName = normalizeText(name);
            if (normalizedName.includes(query)) { 
                matches.push({ id, name });
            }
        }

        matches.sort((a, b) => a.name.localeCompare(b.name, "pl"));

        if (matches.length === 0) {
            suggestions.style.display = "none";
            return;
        }

        suggestions.style.display = "flex";
        suggestions.style.flexDirection = "column";

        matches.slice(0, 5).forEach(match => {
            const suggestionItem = document.createElement("div");
            suggestionItem.classList.add("suggestion-item");
            suggestionItem.textContent = match.name;
            suggestionItem.dataset.id = match.id;

            suggestionItem.addEventListener("click", () => {
                console.log(`✅ Kliknięto na podpowiedź: ${match.name} (ID: ${match.id})`);
                selectSearchResult(match.id);
            });

            suggestions.appendChild(suggestionItem);
        });
    });

    searchButton.addEventListener("click", () => {
        handleSearch();
    });

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSearch();
        }
    });

    function handleSearch() {
        const query = normalizeText(searchInput.value.trim());
        if (!query) return;

        console.log("🔎 [handleSearch] Szukam dla:", query);

        let bestMatch = Object.entries(markerNames)
            .map(([id, name]) => ({
                id,
                name,
                score: fuzzball.token_set_ratio(query, normalizeText(name))
            }))
            .sort((a, b) => b.score - a.score)[0];

        console.log("🔍 Najlepszy wynik:", bestMatch);

        if (bestMatch && bestMatch.score >= 60) {
            selectSearchResult(bestMatch.id);
        } else {
            alert("⚠️ Brak wyników wyszukiwania!");
        }
    }
}

function selectSearchResult(id) {
    console.log(`🔍 [selectSearchResult] Wybrano ID: ${id}`);

    const name = markerNames[id]; 
    if (!name) {
        console.error(`❌ Błąd: Nie znaleziono nazwy dla ID: ${id}`);
        return;
    }

    // ✅ Próbujemy różne warianty kluczy
    const normalizedKey = normalizeText(name);
    const idKey = id.toLowerCase();
    
    console.log("🔎 Sprawdzam w markerObjects:", { idKey, normalizedKey });

    let marker = markerObjects[idKey] || markerObjects[normalizedKey];

    // ✅ Jeśli marker nadal nie znaleziony, wyświetlamy dostępne klucze
    if (!marker) {
        console.error(`❌ Nie znaleziono markera dla ID: ${id} ani nazwy: ${name}`);
        console.log("🔍 markerObjects dostępne klucze:", Object.keys(markerObjects));
        console.log("🔍 Próbuję ręczne wyszukanie:", markerObjects);
        
        // 🛠 Dodatkowe wyszukiwanie przez iterację
        for (let key of Object.keys(markerObjects)) {
            if (normalizeText(key) === normalizedKey) {
                marker = markerObjects[key];
                console.log(`✅ Znaleziono ręcznie marker dla: ${name}`);
                break;
            }
        }
    }

    if (!marker) {
        console.error(`❌ Marker nadal nie znaleziony: ${name} (ID: ${id})`);
        return;
    }

    console.log(`📍 [selectSearchResult] Znaleziono marker: ${name}, ID: ${id}`);

    // 📍 Otwieramy popup
    loadPopupData(marker, id).then(() => {
        map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 12), { duration: 0.5 });

        map.once("moveend", () => {
            marker.openPopup();
            if (window.innerWidth < 768) {
                setTimeout(() => {
                    document.querySelector(".leaflet-popup-content-wrapper").classList.add("mobile-fullscreen-popup");
                }, 300);
            }
        });
    });

    document.getElementById("search-input").value = "";
    document.getElementById("suggestions").innerHTML = "";
    document.getElementById("suggestions").style.display = "none";
}


// ✅ Udostępniamy funkcję globalnie
window.initializeSearch = initializeSearch;
