/* 📌 Styl dla nowego popupu */
.popup-new {
    width: 300px; /* Dopasujemy później */
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
    padding: 12px;
    font-family: Arial, sans-serif;
    position: relative;
}

/* 📸 Slider */
.popup-new .image-slider {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
}

/* 📌 Nagłówek z nazwą lokalizacji */
.popup-new .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    font-weight: bold;
    margin-top: 8px;
}

/* 🔹 Przycisk Dodaj Zdjęcie */
.popup-new .add-photo-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #4CAF50;
    color: white;
    width: 50%;
    height: 32px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 12px;
    cursor: pointer;
    margin: 8px 0;
}

/* 🔹 Sekcja akcji */
.popup-new .actions {
    display: flex;
    justify-content: space-around;
    margin: 10px 0;
}

.popup-new .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    color: #333;
    cursor: pointer;
}

/* 📌 Opis i szczegóły */
.popup-new .description {
    font-size: 12px;
    margin: 10px 0;
    color: #555;
}

/* 📌 Infrastruktura */
.popup-new .amenities {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
}

.popup-new .amenity {
    background: #eaffea;
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 10px;
    color: #333;
    border: 1px solid #66cc66;
}

/* 📌 Przycisk aktualizacji */
.popup-new .update-btn {
    width: 100%;
    background: #4CAF50;
    color: white;
    text-align: center;
    padding: 10px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    margin-top: 10px;
}
