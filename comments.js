const COMMENTS_API_URL = "https://campteam-project-ha31an8nf-marcincamps-projects.vercel.app/api/comments";

// 🔹 Otwieranie popupu komentarzy
document.body.addEventListener("click", function (event) {
    const commentButton = event.target.closest(".open-comments");
    if (commentButton) {
        event.preventDefault();
        const placeId = commentButton.dataset.placeid;
        openCommentPopup(placeId);
    }
});

async function openCommentPopup(placeId) {
    console.log(`📥 Pobieranie komentarzy dla: ${placeId}`);

    const popup = document.getElementById("comment-form-popup");
    const commentListDiv = document.getElementById("comments-list");
    const submitButton = document.getElementById("submit-comment");

    popup.classList.add("active");

    // Czyszczenie starej zawartości
    commentListDiv.innerHTML = "<p>Ładowanie opinii...</p>";

    // Pobieranie opinii
    const comments = await fetchComments(placeId);
    if (comments.length === 0) {
        commentListDiv.innerHTML = "<p>Brak opinii. Bądź pierwszym, który doda swoją!</p>";
    } else {
        commentListDiv.innerHTML = comments.map(comment => `
            <div class="comment">
                <strong>${comment.user}</strong>: ${comment.text}
                <span class="comment-date">${new Date(comment.timestamp).toLocaleString()}</span>
            </div>
        `).join("");
    }

    // Obsługa dodawania opinii
    submitButton.onclick = async function () {
        const text = document.getElementById("comment-input").value.trim();
        const user = document.getElementById("comment-author").value.trim();

        if (!text || !user) {
            alert("⚠️ Wypełnij wszystkie pola!");
            return;
        }

        await submitComment(placeId, user, text);
        openCommentPopup(placeId); // 🔄 Odświeżenie opinii po dodaniu
    };
}
