const PO = require("../models/PO");
const puppeteer = require("puppeteer");


// Get PO by ID
const getPOById = async (req, res) => {
  try {
    const po = await PO.findById(req.params.id).populate("manufacturer supplier bid rfq");
    if (!po) return res.status(404).json({ message: "PO not found" });
    res.json(po);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all POs for logged-in user (supplier or manufacturer)
const getPOsForUser = async (req, res) => {
  try {
    const pos = await PO.find({ $or: [{ manufacturer: req.user._id }, { supplier: req.user._id }] })
      .populate("manufacturer supplier bid rfq");
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark PO as delivered (supplier action)
const markDelivered = async (req, res) => {
  try {
    const po = await PO.findById(req.params.id);
    if (!po) return res.status(404).json({ message: "PO not found" });

    po.status = "delivered";
    await po.save();

    res.json({ message: "PO marked as delivered", po });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Download PO as PDF (supplier)
const downloadPO = async (req, res) => {
  try {
    const po = await PO.findById(req.params.id)
      .populate("manufacturer supplier bid rfq");

    if (!po) return res.status(404).json({ message: "PO not found" });

    // HTML template for the invoice
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Purchase Order (PO)</h1>
          <p><strong>PO ID:</strong> ${po._id}</p>
          <p><strong>Manufacturer:</strong> ${po.manufacturer.name}</p>
          <p><strong>Supplier:</strong> ${po.supplier.name}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

          <table>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
            ${po.items
              .map(
                item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unitPrice.toFixed(2)}</td>
                  <td>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `
              )
              .join("")}
          </table>
          <p class="total">Grand Total: ${po.totalAmount.toFixed(2)}</p>
        </body>
      </html>
    `;

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // Send PDF as downloadable file
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=PO_${po._id}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getPOById,
  getPOsForUser,
  markDelivered,
  downloadPO,
};
