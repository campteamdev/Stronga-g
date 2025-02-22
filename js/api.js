
async function generateToken(filename) {
    const response = await fetch(`https://campteam-9l04l41bs-marcincamps-projects.vercel.app/api/token?filename=${filename}`);
    const data = await response.json();
    return data.token;
  }
async function fetchKml(filename) {
    const token = await generateToken(filename); // ✅ Czekamy na token
    const url = `https://campteam-9l04l41bs-marcincamps-projects.vercel.app/api/kml?id=${filename}&token=${token}`;
  
  
  
    const response = await fetch(url);
    if (!response.ok) throw new Error(`❌ Błąd wczytywania pliku KML: ${url}`);
  
    return response.text();
  }
  