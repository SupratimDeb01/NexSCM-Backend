const mongoose = require("mongoose");
const InvoiceSchema = new mongoose.Schema({
  po: { type: mongoose.Schema.Types.ObjectId, ref: "PO", required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number
  }],
  totalAmount: Number,
  status: { type: String, enum: ["pending", "approved", "disputed"], default: "pending" }
}, { timestamps: true });
module.exports = mongoose.model("Invoice", InvoiceSchema);