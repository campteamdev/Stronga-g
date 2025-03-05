const COMMENTS_API_URL = "https://campteam-9l04l41bs-marcincamps-projects.vercel.app/api/comments";


// ✅ Pobieranie komentarzy dla danego miejsca
async function fetchComments(placeId) {
    try {
        const response = await fetch(`${COMMENTS_API_URL}?id=${placeId}`);
        if (!response.ok) throw new Error("Błąd pobierania komentarzy.");

        return await response.json();
    } catch (error) {
        console.error("❌ Błąd pobierania komentarzy:", error);
        return [];
    }
}

// ✅ Dodanie formularza komentarzy do popupu
function addCommentFormToPopup(marker, placeId) {
    // 🛠️ Pobranie komentarzy i ich wyświetlenie
    fetchComments(placeId).then(comments => {
        const commentList = comments.map(comment => `
            <div class="comment">
                <strong>${comment.author}</strong>:
                <p>${comment.text}</p>
            </div>
        `).join("");

        // 📝 Formularz dodawania komentarza
        const formHTML = `
            <div id="comments-section">
                <h3>Komentarze</h3>
                <div id="comments-list">${commentList || "Brak komentarzy"}</div>
                <textarea id="comment-input" placeholder="Dodaj komentarz..."></textarea>
                <input type="text" id="comment-author" placeholder="Twoje imię">
                <button id="submit-comment">Dodaj</button>
            </div>
        `;

        marker.bindPopup(formHTML).openPopup();

        // 🎯 Obsługa wysyłania komentarza
        document.getElementById("submit-comment").addEventListener("click", async () => {
            const text = document.getElementById("comment-input").value.trim();
            const author = document.getElementById("comment-author").value.trim();

            if (!text || !author) return alert("⚠️ Wypełnij wszystkie pola!");

            await submitComment(placeId, author, text);
            addCommentFormToPopup(marker, placeId);
        });
    });
}

// ✅ Wysyłanie komentarza do API (zapis na AWS S3)
async function submitComment(placeId, author, text) {
    try {
        const response = await fetch(COMMENTS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: placeId, author, text }),
        });

        if (!response.ok) throw new Error("Błąd zapisu komentarza.");
        alert("✅ Komentarz dodany!");
    } catch (error) {
        console.error("❌ Błąd dodawania komentarza:", error);
    }
}

// ✅ Integracja z markerami na mapie
map.on("popupopen", function (e) {
    const marker = e.popup._source;
    const placeId = marker.id;
    addCommentFormToPopup(marker, placeId);
});
