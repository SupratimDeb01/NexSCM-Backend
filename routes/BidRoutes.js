const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  submitBid,
  getBidsByRequest,
  recommendBid,
  selectBid, 
  getMyBids,
  rejectBid,
  getAcceptedBids,
  getSelectedBidsForSupplier
} = require("../controllers/bidController");

const router = express.Router();

// Get all bids for a particular RFQ (manufacturer only)
router.get("/rfq/:rfqId", protect, getBidsByRequest);

// Supplier submits a bid for an RFQ
router.post("/:rfqId", protect, submitBid);

// Supplier → get his own submitted bids
router.get("/my-bids", protect, getMyBids);


// Recommend best bid automatically (system or manufacturer triggers)
router.put("/:bidId/recommend", protect, recommendBid);


// Manufacturer selects a bid → creates PO
router.put("/:bidId/select", protect, selectBid);

// routes/bidRoutes.js
router.put("/:bidId/reject", protect, rejectBid);

// Manufacturer → view all accepted bids
router.get("/accepted", protect, getAcceptedBids);

// Supplier → view all SELECTED bids
router.get("/selected", protect, getSelectedBidsForSupplier);



module.exports = router;
