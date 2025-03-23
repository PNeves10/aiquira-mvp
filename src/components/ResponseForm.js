import React, { useState } from "react";

const ResponseForm = ({ listingId, reviewIndex, token, onResponseSubmitted }) => {
    const [responseText, setResponseText] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const response = await fetch(`http://localhost:5000/api/listings/${listingId}/reviews/${reviewIndex}/respond`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ responseText }),
        });

        const data = await response.json();
        if (!response.ok) return setMessage(data.error || "Erro ao enviar resposta.");

        setMessage("✅ Resposta enviada!");
        setResponseText("");
        onResponseSubmitted(); // Atualiza a lista de avaliações
    };

    return (
        <form onSubmit={handleSubmit} className="mt-2 p-3 border rounded bg-gray-100">
            <label className="block">✍ Responder:</label>
            <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} className="border p-2 rounded w-full" rows="2"></textarea>

            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mt-2">Enviar Resposta</button>

            {message && <p className="mt-2 text-green-500">{message}</p>}
        </form>
    );
};

export default ResponseForm;
