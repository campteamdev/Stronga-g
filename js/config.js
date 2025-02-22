const urls = {
    kempingi: "/Kempingi.kml",
    polanamiotowe: "/Polanamiotowe.kml",
    kempingiopen: "/Kempingiopen.kml",
    polanamiotoweopen: "/Polanamiotoweopen.kml",
    parkingilesne: "/Parkingilesne.kml",
    kempingi1: "/Kempingi1.kml",
    AtrakcjeKulturowe: "/AtrakcjeKulturowe.kml",
    AtrakcjePrzyrodnicze: "/AtrakcjePrzyrodnicze.kml",
    AtrakcjeRozrywka: "/AtrakcjeRozrywka.kml",
    miejscenabiwak: "/Miejscenabiwak.kml",
    europa: "/Europa.kml", // Dodajemy URL do pliku europa.kml
  };
  
  const icons = {
    kempingi: L.icon({
      iconUrl: "/ikony/Ikona_Kempingi_Polecane.png",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    }),
    polanamiotowe: L.icon({
      iconUrl: "/ikony/Ikona_Pole_Namiotowe.png",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    }),
    kempingiopen: L.icon({
      iconUrl: "/ikony/Ikona_Kempingi.png",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -10],
    }),
    polanamiotoweopen: L.icon({
      iconUrl: "/ikony/Ikona_Pole_Namiotowe.png",
      iconSize: [40, 40],
      iconAnchor: [15, 15],
      popupAnchor: [0, -10],
    }),
    parkingilesne: L.icon({
      iconUrl: "/ikony/Ikona_Parking_Le%C5%9Bny.png",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -10],
    }),
    kempingi1: L.icon({
      iconUrl: "/ikony/Ikona_Kempingi.png",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -10],
    }),
    atractionCultural: L.icon({
      iconUrl: "/ikony/atractionCultural.png",
      iconSize: [35, 35],
      iconAnchor: [15, 15],
      popupAnchor: [0, -10],
    }),
    atractionFun: L.icon({
      iconUrl: "/ikony/atractionFun.png",
      iconSize: [35, 35],
      iconAnchor: [15, 15],
      popupAnchor: [0, -10],
    }),
    atractionNature: L.icon({
      iconUrl: "/ikony/atractionNature.png",
      iconSize: [35, 35],
      iconAnchor: [15, 15],
      popupAnchor: [0, -10],
    }),
    miejscenabiwak: L.icon({
      iconUrl: "/ikony/Ikona_Miejsce_Biwakowe.png",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -10],
    }),
  };