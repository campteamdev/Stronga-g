const encodedKML = {
    "Kempingi.kml": "S2VtcGluZ2kua21s",
    "Polanamiotowe.kml": "UG9sYW5hbWlvdG93ZS5rbWw=",
    "Kempingiopen.kml": "S2VtcGluZ2lvcGVuLmttbA==",
    "Polanamiotoweopen.kml": "UG9sYW5hbWlvdG93ZW9wZW4ua21s",
    "Parkingilesne.kml": "UGFya2luZ2lsZXNuZS5rbWw=",
    "Kempingi1.kml": "S2VtcGluZ2kxLmttbA==",
    "AtrakcjeKulturowe.kml": "QXRyYWtjamVLdWx0dXJvd2Uua21s",
    "AtrakcjePrzyrodnicze.kml": "QXRyYWtjamVQcnp5cm9kbmljemUua21s",
    "AtrakcjeRozrywkowe.kml": "QXRyYWtjamVSb3pyeXdrb3dlLmttbA==",
    "Miejscenabiwak.kml": "TWllanNjZW5hYml3YWsua21s",
    "Europa.kml": "RXVyb3BhLmttbA=="
};

function getKML(filename) {
    return atob(encodedKML[filename]); // Dekodowanie Base64 nazwy pliku
}
