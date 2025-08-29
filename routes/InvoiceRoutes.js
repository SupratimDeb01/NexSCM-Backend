const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  submitInvoice,
  verifyInvoice,
  disputeInvoice,
  getInvoicesForUser,
  downloadInvoice 
} = require("../controllers/invoiceController");

const router = express.Router();

// Supplier submits invoice for a PO
router.post("/", protect, submitInvoice);

// Manufacturer verifies invoice (approved)
router.put("/:id/verify", protect, verifyInvoice);

// Manufacturer disputes invoice
router.put("/:id/dispute", protect, disputeInvoice);

// Download invoice as PDF
router.get("/:id/download", protect, downloadInvoice);

// Get invoices for logged-in user
router.get("/", protect, getInvoicesForUser);

module.exports = router;
