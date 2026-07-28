const express = require("express");
const {
  createPolicy,
  getAllPolicies,
  getPolicyById,
  getActivePolicies,
  renewPolicy,
  cancelPolicy,
} = require("../controllers/policyController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", authorizeRoles("ADMIN", "AGENT"), createPolicy);
router.get("/", getAllPolicies); // customer sees own, admin/agent see all
router.get("/active", getActivePolicies);
router.get("/:id", getPolicyById);
router.put("/:id/renew", authorizeRoles("ADMIN", "AGENT"), renewPolicy);
router.put("/:id/cancel", authorizeRoles("ADMIN", "AGENT"), cancelPolicy);

module.exports = router;
