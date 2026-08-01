const express = require("express");
const {
  getDashboardSummary,
  getMonthlyReport,
  getCustomerGrowth,
} = require("../controllers/reportController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("ADMIN", "AGENT"));

router.get("/summary", getDashboardSummary);
router.get("/monthly", getMonthlyReport);
router.get("/customer-growth", getCustomerGrowth);

module.exports = router;
