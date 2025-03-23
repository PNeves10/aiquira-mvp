import { useEffect, useState } from "react";

const Reviews = ({ listingId }) => {
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        fetch(`/api/reviews/${listingId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Erro: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                setReviews(data);
                if (data.length > 0) {
                    const avg = data.reduce((acc, review) => acc + review.rating, 0) / data.length;
                    setAverageRating(avg.toFixed(1)); // Arredondar para uma casa decimal
                } else {
                    setAverageRating(0); // Se não houver avaliações, a média é 0
                }
            })
            .catch(error => {
                console.error("Erro ao buscar avaliações:", error);
            });
    }, [listingId]);

    return (
        <div>
            <h3>📢 Avaliações ({averageRating}⭐)</h3>
            {reviews.length === 0 ? (
                <p>❌ Ainda não há avaliações.</p>
            ) : (
                reviews.map((review, index) => (
                    <div key={index} className="review">
                        <p><strong>{review.buyer.username}</strong>: {review.rating}⭐</p>
                        <p>{review.comment}</p>
                    </div>
                ))
            )}
        </div>
    );
};

export default Reviews;