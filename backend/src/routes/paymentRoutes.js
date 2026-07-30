const express = require("express");
const {
  createPayment,
  getAllPayments,
  markPaymentPaid,
  getOverduePayments,
  getPaymentHistoryByPolicy,
} = require("../controllers/paymentController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", authorizeRoles("ADMIN", "AGENT"), createPayment);
router.get("/", getAllPayments); // customer sees own, admin/agent see all
router.get("/overdue", authorizeRoles("ADMIN", "AGENT"), getOverduePayments);
router.get("/policy/:policyId", getPaymentHistoryByPolicy);
router.put("/:id/pay", markPaymentPaid);

module.exports = router;
