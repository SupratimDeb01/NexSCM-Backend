const Bid = require("../models/Bid");
const Request = require("../models/RFQ");
const PO = require("../models/PO");

// Supplier submits bid
const submitBid = async (req, res) => {
  try {
   const { unitPrice, deliveryDays } = req.body;
const { rfqId } = req.params;

const request = await Request.findById(rfqId);

    if (!request) return res.status(404).json({ message: "RFQ not found" });

    const total = unitPrice * request.quantity;

  const bid = await Bid.create({
  rfq: rfqId,
  supplier: req.user._id,
  unitPrice,
  deliveryDays,
  total,
});


    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all bids for an RFQ (manufacturer only)
const getBidsByRequest = async (req, res) => {
  try {
    const bids = await Bid.find({ rfq: req.params.rfqId }).populate("supplier", "name email");
    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Recommend best bid (simple example: lowest total)
const recommendBid = async (req, res) => {
  try {
    const bids = await Bid.find({ rfq: req.params.rfqId });
    if (!bids.length) return res.status(404).json({ message: "No bids found" });

    const bestBid = bids.reduce((prev, curr) => (curr.total < prev.total ? curr : prev));

    bestBid.status = "RECOMMENDED";
    await bestBid.save();

    res.json({ message: "Bid recommended", bid: bestBid });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const selectBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId).populate("rfq supplier");
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    // Update bid status
    bid.status = "SELECTED";
    await bid.save();

    // Reject all other bids for this RFQ
    await Bid.updateMany(
      { rfq: bid.rfq._id, _id: { $ne: bid._id } },
      { status: "REJECTED" }
    );

    // Create PO
    const po = await PO.create({
      manufacturer: bid.rfq.manufacturer,
      supplier: bid.supplier._id,
      rfq: bid.rfq._id,
      bid: bid._id,
      items: [
        {
          description: bid.rfq.title,
          quantity: bid.rfq.quantity,
          unitPrice: bid.unitPrice,
        },
      ],
      totalAmount: bid.total,
    });

    
// LINK PO TO BID
bid.po = po._id;       // <- this is important
await bid.save();

    // Properly update the RFQ status using the Request model
    await Request.findByIdAndUpdate(bid.rfq._id, { status: "closed" });

    res.json({ message: "Bid selected & PO created", po });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all bids submitted by the logged-in supplier
const getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ supplier: req.user._id })
      .populate({
        path: "rfq",
        select: "title description quantity deadline status manufacturer",
        populate: { path: "manufacturer", select: "name" }
      })
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reject a bid
const rejectBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    bid.status = "REJECTED";
    await bid.save();

    res.json({ message: "Bid rejected successfully", bid });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all accepted (SELECTED) bids for a manufacturer
// const getAcceptedBids = async (req, res) => {
//   try {
//     const bids = await Bid.find({ status: "SELECTED" })
//       .populate({
//         path: "rfq",
//         match: { manufacturer: req.user._id }, // only fetch rfqs created by this manufacturer
//         select: "title quantity deadline status",
//       })
//       .populate("supplier", "name email")
//       .sort({ createdAt: -1 });

//     // Filter out bids whose RFQs don't belong to this manufacturer
//     const filteredBids = bids.filter(b => b.rfq !== null);

//     res.json(filteredBids);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

const getAcceptedBids = async (req, res) => {
  try {
    const bids = await Bid.find({ status: "SELECTED" })
      .populate({
        path: "rfq",
        match: { manufacturer: req.user._id },
        select: "title quantity deadline status",
      })
      .populate("supplier", "name email")
      .populate({
        path: "po",
        select: "_id totalAmount status invoice",
        populate: {
          path: "invoice", // populate invoice
          select: "_id totalAmount status createdAt"
        }
      })
      .sort({ createdAt: -1 });

    const filteredBids = bids.filter((b) => b.rfq !== null);

    res.json(filteredBids);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getSelectedBidsForSupplier = async (req, res) => {
  try {
    const bids = await Bid.find({ supplier: req.user._id, status: "SELECTED" })
      .populate({
        path: "rfq",
        select: "title description quantity deadline manufacturer",
        populate: { path: "manufacturer", select: "name email" }
      })
      .populate({
        path: "po", // <-- populate po so frontend gets PO object (and _id)
        select: "_id totalAmount status" // include fields you need
      })
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = {
  submitBid,
  getBidsByRequest,
  recommendBid,
  selectBid,
  getMyBids,
  rejectBid,
  getAcceptedBids,
  getSelectedBidsForSupplier  // <- export the new controller
};

