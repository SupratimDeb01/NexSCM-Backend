// models/Bid.js
const mongoose = require("mongoose");

const BidSchema = new mongoose.Schema({
  rfq: { type: mongoose.Schema.Types.ObjectId, ref: "RFQ", required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  unitPrice: Number,
  deliveryDays: Number,
  total: Number,
   po: { type: mongoose.Schema.Types.ObjectId, ref: "PO" }, // <-- ADDED
  status: { type: String, enum: ["PENDING", "RECOMMENDED", "SELECTED", "REJECTED"], default: "PENDING" }
}, { timestamps: true });

module.exports = mongoose.model("Bid", BidSchema);
