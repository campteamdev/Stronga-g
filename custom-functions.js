// Pobranie elementów modalowego popupu
const modalPopup = document.getElementById("modal-popup");
const popupContent = document.getElementById("popup-inner-content");
const closePopup = document.getElementById("close-popup");

// Zamknięcie modala po kliknięciu "X"
closePopup.addEventListener("click", () => {
    modalPopup.style.display = "none";
});

// Funkcja wyświetlająca popup jako modal
function showPopup(name, lat, lon) {
    let popupHTML = `<h2>${name}</h2>`;

    // Telefon
    popupHTML += `<p><strong>Kontakt:</strong> <a href="tel:+48000000000">+48 000 000 000</a></p>`;

    // Strona internetowa
    popupHTML += `<p><strong>Strona:</strong> <a href="https://example.com" target="_blank">example.com</a></p>`;

    // Opis
    popupHTML += `<p><strong>Opis:</strong> Opis przykładowy...</p>`;

    // Linki nawigacyjne
    popupHTML += `<a href="https://www.google.com/maps/search/${encodeURIComponent(name)}" target="_blank" class="details-button">Link do Map Google</a>`;
    popupHTML += `<a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" class="navigate-button">Prowadź</a>`;
    popupHTML += `<a href="https://www.campteam.pl/dodaj/dodaj-zdjęcie-lub-opinię" target="_blank" class="update-button">Dodaj Zdjęcie/Aktualizuj</a>`;

    popupContent.innerHTML = popupHTML;
    modalPopup.style.display = "flex"; // Pokaż modal
}
