import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }, // Adicionado o campo role com enum
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }] // Lista de favoritos
}, { timestamps: true }); // Adiciona campos de createdAt e updatedAt

const User = mongoose.model("User", UserSchema);
export default User;