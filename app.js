require("dotenv").config();
const express=require("express");
const cors=require("cors");
const path=require("path");
const connectDB=require("./config/db");

const authRoutes = require('./routes/authRoutes');

const app=express();

//middleware to handle cors
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

//connect DAtabase
connectDB();

//Middleware
app.use(express.json());

//api routes for register login and uploading file
app.use("/api/auth",authRoutes);
app.use("/api/rfq", require("./routes/RfqRoutes"));
app.use("/api/bid", require("./routes/BidRoutes"));
app.use("/api/po", require("./routes/PoRoutes"));
// app.use("/api/grn", require("./routes/grnRoutes"));
app.use("/api/invoice", require("./routes/InvoiceRoutes"));

//start server
const PORT=process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`)); 