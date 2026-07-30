const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const policyRoutes = require("./routes/policyRoutes");
const claimRoutes = require("./routes/claimRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Insurance Management Platform API is running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/payments", paymentRoutes);

module.exports = app;
