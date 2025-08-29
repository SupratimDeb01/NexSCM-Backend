const Request = require("../models/RFQ");

const createRequest = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    console.log("REQ USER:", req.user);

    const { title, description, quantity, deadline } = req.body;

    if (!title || !description || !quantity || !deadline) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const request = await Request.create({
      manufacturer: req.user._id,
      title,
      description,
      quantity,
      deadline: new Date(deadline),
      status: "open",   // 👈 added
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("CREATE RFQ ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all open RFQs (for suppliers)
const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find({ status: "open" }).populate("manufacturer", "name email");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single RFQ
const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("manufacturer", "name email");
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message }); 
  }
};


// Delete RFQ by ID (only manufacturer who created it can delete)
const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });

    // Check if the logged-in user is the owner (manufacturer)
    if (request.manufacturer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this RFQ" });
    }

    await request.deleteOne();
    res.json({ message: "RFQ deleted successfully" });
  } catch (error) {
    console.error("DELETE RFQ ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Close RFQ (after PO issued)
const closeRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "closed";
    await request.save();

    res.json({ message: "Request closed successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Get all RFQs created by the logged-in manufacturer
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ manufacturer: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { 
  createRequest, 
  getAllRequests, 
  getRequestById, 
  deleteRequest, 
  closeRequest, 
  getMyRequests 
};

