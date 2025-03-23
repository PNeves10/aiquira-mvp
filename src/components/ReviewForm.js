import React, { useState } from "react";

const ReviewForm = ({ listingId, token, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const response = await fetch(`http://localhost:5000/api/listings/${listingId}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ rating, comment }),
        });

        const data = await response.json();
        if (!response.ok) return setMessage(data.error || "Erro ao enviar avaliação.");

        setMessage("✅ Avaliação enviada!");
        setRating(5);
        setComment("");
        onReviewSubmitted(); // Atualiza a lista de avaliações
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded shadow-lg bg-white">
            <h3 className="text-lg font-bold">📝 Avaliar Website</h3>

            <label className="block mt-2">⭐ Nota:</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border p-2 rounded">
                {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                        {num} Estrela{num > 1 ? "s" : ""}
                    </option>
                ))}
            </select>

            <label className="block mt-2">💬 Comentário:</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="border p-2 rounded w-full" rows="3"></textarea>

            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-2">Enviar Avaliação</button>

            {message && <p className="mt-2 text-green-500">{message}</p>}
        </form>
    );
};

export default ReviewForm;