// 🔹 Funkcja podświetlająca marker (zmienia ikonę na większą na chwilę)
function highlightMarker(match) {
    const originalIcon = match.marker.options.icon;

    const highlightIcon = L.icon({
        iconUrl: "/ikony/highlight.png", // Dodaj specjalną ikonę podświetlenia
        iconSize: [50, 50], 
        iconAnchor: [25, 25],
        popupAnchor: [0, -25]
    });

    match.marker.setIcon(highlightIcon);

    setTimeout(() => {
        match.marker.setIcon(originalIcon);
    }, 1500);
}