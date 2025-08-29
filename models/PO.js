// // models/PO.js
// const mongoose = require("mongoose");
// const POSchema = new mongoose.Schema({
//   manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   supplier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   rfq: { type: mongoose.Schema.Types.ObjectId, ref: "RFQ", required: true },
//   bid: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
//   items: [{
//     description: String,
//     quantity: Number,
//     unitPrice: Number
//   }],
//   totalAmount: Number,
//   status: { type: String, enum: ["issued", "delivered", "closed"], default: "issued" }
// }, { timestamps: true });
// module.exports = mongoose.model("PO", POSchema);


const mongoose = require("mongoose");

const POSchema = new mongoose.Schema({
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rfq: { type: mongoose.Schema.Types.ObjectId, ref: "RFQ", required: true },
  bid: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
  items: [
    {
      description: String,
      quantity: Number,
      unitPrice: Number
    }
  ],
  totalAmount: Number,
  status: { type: String, enum: ["issued", "delivered", "closed"], default: "issued" },

  // 🔑 Add reference to invoice
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }

}, { timestamps: true });

module.exports = mongoose.model("PO", POSchema);
