import mongoose from 'mongoose';

// Definindo o esquema para as listagens
const listingSchema = new mongoose.Schema({
    url: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referência ao modelo User
    ratings: [{ 
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Referência ao modelo User
        rating: { type: Number, required: true }, // Nota da avaliação
        comment: { type: String, required: false }, // Comentário da avaliação
        response: { text: String, date: Date }, // 🔹 Resposta do vendedor
        createdAt: { type: Date, default: Date.now } // Data da avaliação
    }],
    rating: { type: Number, default: 0 }, // ⭐ Média das avaliações
    createdAt: { type: Date, default: Date.now }, // Data da criação
    views: { type: Number, default: 0 }, // Número de visualizações
    salesCount: { type: Number, default: 0 } // Número de vendas
}, { timestamps: true }); // Adiciona campos de createdAt e updatedAt

// Criando o modelo
const Listing = mongoose.model('Listing', listingSchema);

export default Listing;