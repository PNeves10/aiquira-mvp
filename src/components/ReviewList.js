import React, { useEffect, useState } from "react";
import ResponseForm from "./ResponseForm.js"; // Adicione a extensão .js

const ReviewList = ({ listingId, token, isOwner }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = async () => {
        const response = await fetch(`http://localhost:5000/api/listings/${listingId}/reviews`);
        const data = await response.json();
        setReviews(data.reviews || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchReviews();
    }, [listingId]);

    return (
        <div className="p-4 mt-4 border rounded shadow-lg bg-white">
            <h3 className="text-lg font-bold">⭐ Avaliações</h3>
            {loading ? (
                <p>Carregando...</p>
            ) : reviews.length === 0 ? (
                <p>Nenhuma avaliação ainda.</p>
            ) : (
                reviews.map((review, index) => (
                    <div key={index} className="mt-2 p-2 border-b">
                        <p><strong>{review.user.username}</strong> - ⭐ {review.rating}</p>
                        <p>💬 {review.comment}</p>

                        {review.response ? (
                            <div className="ml-4 mt-2 p-2 border-l-4 border-green-500 bg-gray-100">
                                <p><strong>👤 Vendedor:</strong> {review.response.text}</p>
                                <small className="text-gray-500">{new Date(review.response.date).toLocaleString()}</small>
                            </div>
                        ) : (
                            isOwner && (
                                <ResponseForm 
                                    listingId ={listingId} 
                                    reviewIndex={index} 
                                    token={token} 
                                    onResponseSubmitted={fetchReviews} 
                                />
                            )
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default ReviewList;