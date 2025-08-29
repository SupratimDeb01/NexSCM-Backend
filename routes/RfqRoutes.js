const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  createRequest,
  getAllRequests,
  getRequestById,
  closeRequest,
  getMyRequests,
  deleteRequest,
} = require("../controllers/requestController");

const router = express.Router();

// Create a new RFQ (manufacturer only)
router.post("/", protect, createRequest);

// Get all RFQs created by the logged-in manufacturer
router.get("/my-requests", protect, getMyRequests); 

// Get all open RFQs (suppliers see this)
router.get("/", protect, getAllRequests);



// Get details of a single RFQ
router.get("/:id", protect, getRequestById);

// Close an RFQ (after PO issued)
router.put("/:id/close", protect, closeRequest);

// ✅ Delete an RFQ by ID (manufacturer only)
router.delete("/:id", protect, deleteRequest);

module.exports = router;
