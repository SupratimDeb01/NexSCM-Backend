const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getPOById,
  getPOsForUser,
  markDelivered,
  downloadPO
} = require("../controllers/poController");

const router = express.Router();

// Get PO by ID
router.get("/:id", protect, getPOById);

// Get all POs for logged-in user (manufacturer or supplier)
router.get("/", protect, getPOsForUser);

// Mark PO as delivered (supplier action)
router.put("/:id/deliver", protect, markDelivered);

// Download PO as PDF (supplier action)
router.get("/:id/download", protect, downloadPO);

module.exports = router;
