const express = require("express");
const {
  submitClaim,
  getAllClaims,
  getClaimById,
  approveClaim,
  rejectClaim,
  getClaimStats,
} = require("../controllers/claimController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", submitClaim); // customer submits their own claim
router.get("/", getAllClaims); // customer sees own, admin/agent see all
router.get("/stats", authorizeRoles("ADMIN", "AGENT"), getClaimStats);
router.get("/:id", getClaimById);
router.put("/:id/approve", authorizeRoles("ADMIN", "AGENT"), approveClaim);
router.put("/:id/reject", authorizeRoles("ADMIN", "AGENT"), rejectClaim);

module.exports = router;
