const express = require("express");
const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} = require("../controllers/customerController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

// All routes below require login
router.use(protect);

router.post("/", authorizeRoles("ADMIN", "AGENT"), createCustomer);
router.get("/", authorizeRoles("ADMIN", "AGENT"), getAllCustomers);
router.get("/search", authorizeRoles("ADMIN", "AGENT"), searchCustomers);
router.get("/:id", getCustomerById); // customer can view own profile too
router.put("/:id", updateCustomer);
router.delete("/:id", authorizeRoles("ADMIN", "AGENT"), deleteCustomer);

module.exports = router;
