import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    amount: { 
        type: Number, 
        required: true, 
        min: 0 // Garante que o valor seja positivo
    },
    status: { type: String, enum: ['pendente', 'concluído', 'cancelado'], default: 'pendente' }
}, { timestamps: true }); // Adiciona createdAt e updatedAt automaticamente

export default mongoose.model('Transaction', TransactionSchema);