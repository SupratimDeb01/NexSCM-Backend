const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ["open", "closed"], default: "open" }
}, { timestamps: true });

module.exports = mongoose.model("RFQ", RequestSchema);
