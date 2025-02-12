// WebAssembly – ukryte linki do KML
export function getKMLUrls(): string {
    return JSON.stringify({
        "kempingi": "/Kempingi.kml",
        "polanamiotowe": "/Polanamiotowe.kml",
        "kempingiopen": "/Kempingiopen.kml",
        "polanamiotoweopen": "/Polanamiotoweopen.kml",
        "parkingilesne": "/Parkingilesne.kml",
        "kempingi1": "/Kempingi1.kml",
        "AtrakcjeKulturowe": "/AtrakcjeKulturowe.kml",
        "AtrakcjePrzyrodnicze": "/AtrakcjePrzyrodnicze.kml",
        "AtrakcjeRozrywka": "/AtrakcjeRozrywka.kml",
        "miejscenabiwak": "/Miejscenabiwak.kml",
        "europa": "/Europa.kml"
    });
}
