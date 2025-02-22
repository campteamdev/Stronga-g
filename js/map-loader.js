// Funkcja wczytująca dane z KML
async function loadKmlData() {
    const kmlFiles = [
      "Kempingi.kml",
      "Polanamiotowe.kml",
      "Kempingiopen.kml",
      "Polanamiotoweopen.kml",
      "Parkingilesne.kml",
      "Kempingi1.kml",
      "AtrakcjeKulturowe.kml",
      "AtrakcjePrzyrodnicze.kml",
      "AtrakcjeRozrywka.kml",
      "Miejscenabiwak.kml",
      "Europa.kml",
    ];
  
    for (const filename of kmlFiles) {
      try {
        const kmlText = await fetchKml(filename); // ✅ Pobiera plik z API Vercel
  
  
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlText, "application/xml");
        const placemarks = kml.getElementsByTagName("Placemark");
  
        for (const placemark of placemarks) {
          const name = placemark.getElementsByTagName("name")[0]?.textContent.trim();
          const description = placemark.getElementsByTagName("description")[0]?.textContent.trim();
          const website = placemark.querySelector("Data[name='Strona www:'] > value")?.textContent.trim() || extractWebsite(description);
  
          // Pobieranie danych Opis i Infrastruktura
          const opisNode = placemark.querySelector("Data[name='Opis:'] > value");
          const infrastrukturaNode = placemark.querySelector("Data[name='Udogodnienia:'] > value");
  
          const opis = opisNode ? opisNode.textContent.trim() : "";
          let infrastruktura = infrastrukturaNode ? infrastrukturaNode.textContent.trim() : "";
  
          // Usunięcie zbędnych znaków z infrastruktury
          if (infrastruktura) {
            infrastruktura = infrastruktura
              .replace(/-?\s*(nr[:.]?|[0-9]+|\(|\)|\[|\])/g, "") // Usuwa "nr:", "nr.", cyfry, nawiasy
              .trim()
              .replace(/\s{2,}/g, " "); // Usuwa nadmiarowe spacje
            infrastruktura = infrastruktura.split("\n").join("<br>"); // Formatowanie HTML
          }
  
          if (name) {
            if (description) {
              const phone = extractPhoneNumber(description);
              phoneNumbersMap[name] = phone || "Brak numeru kontaktowego";
            }
            if (website) {
              websiteLinksMap[name] = website;
            }
            descriptionsMap[name] = opis;
            amenitiesMap[name] = infrastruktura;
          }
        }
      } catch (error) {
        console.error(`❌ Błąd podczas przetwarzania pliku ${filename}:`, error);
      }
    }
  }
  