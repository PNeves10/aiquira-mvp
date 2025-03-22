import mongoose from 'mongoose';

// Definindo o esquema para as listagens
const listingSchema = new mongoose.Schema({
    url: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Alterado para ObjectId que referencia o modelo User
}, { timestamps: true }); // Adiciona campos de createdAt e updatedAt

// Criando o modelo
const Listing = mongoose.model('Listing', listingSchema);

export default Listing;