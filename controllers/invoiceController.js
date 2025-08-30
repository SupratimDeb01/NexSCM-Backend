// controllers/invoiceController.js
const Invoice = require("../models/Invoice");
const PO = require("../models/PO");
// const puppeteer = require("puppeteer");
const puppeteer = require("puppeteer-core");

// Supplier submits invoice
const submitInvoice = async (req, res) => {
  try {
    const { poId, items, totalAmount } = req.body;
    const po = await PO.findById(poId);
    if (!po) return res.status(404).json({ message: "PO not found" });

    const invoice = await Invoice.create({
      po: po._id,
      supplier: req.user._id,
      manufacturer: po.manufacturer,
      items,
      totalAmount,
    });

    // 🔑 Update PO with reference to invoice
    po.invoice = invoice._id;
    await po.save();

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Manufacturer verifies invoice
const verifyInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("po");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Simple verification: amount matches PO
    if (invoice.totalAmount === invoice.po.totalAmount) {
      invoice.status = "approved";
      await invoice.save();
      res.json({ message: "Invoice approved", invoice });
    } else {
      invoice.status = "disputed";
      await invoice.save();
      res.json({ message: "Invoice amount mismatch, disputed", invoice });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Fixed: Get invoices for logged-in user (with filtering + population)
const getInvoicesForUser = async (req, res) => {
  try {
    let invoices;

    if (req.user.role === "manufacturer") {
      invoices = await Invoice.find()
        .populate({
          path: "po",
          match: { manufacturer: req.user._id }, // only this manufacturer’s POs
          populate: [
            { path: "supplier", select: "name email" },
            { path: "rfq", select: "title quantity" }
          ],
        })
        .populate("manufacturer", "name email");

      invoices = invoices.filter(inv => inv.po !== null);
    } else if (req.user.role === "supplier") {
      invoices = await Invoice.find()
        .populate({
          path: "po",
          match: { supplier: req.user._id }, // only this supplier’s POs
          populate: [
            { path: "manufacturer", select: "name email" },
            { path: "rfq", select: "title quantity" }
          ],
        })
        .populate("supplier", "name email");

      invoices = invoices.filter(inv => inv.po !== null);
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Dispute invoice
const disputeInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    invoice.status = "disputed";
    await invoice.save();
    res.json({ message: "Invoice disputed", invoice });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Download invoice as PDF
const downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("po")
      .populate("supplier", "name email")
      .populate("manufacturer", "name email");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Authorization: only supplier or manufacturer can download
    if (
      invoice.supplier._id.toString() !== req.user._id.toString() &&
      invoice.manufacturer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to download this invoice" });
    }

    // Build HTML template
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
            .status { margin-top: 15px; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>Invoice</h1>
          <p><strong>Invoice ID:</strong> ${invoice._id}</p>
          <p><strong>PO ID:</strong> ${invoice.po._id}</p>
          <p><strong>Supplier:</strong> ${invoice.supplier.name} (${invoice.supplier.email})</p>
          <p><strong>Manufacturer:</strong> ${invoice.manufacturer.name} (${invoice.manufacturer.email})</p>
          <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>

          <table>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
            ${invoice.items
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
          <p class="total">Grand Total: ${invoice.totalAmount.toFixed(2)}</p>
          <p class="status">Status: ${invoice.status}</p>
        </body>
      </html>
    `;

    // Generate PDF
    // const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const browser = await puppeteer.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: [ "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",],
});
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // Send PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Invoice_${invoice._id}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  submitInvoice,
  verifyInvoice,
  disputeInvoice,
  getInvoicesForUser,
  downloadInvoice
};

