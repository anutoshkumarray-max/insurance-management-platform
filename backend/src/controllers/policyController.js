const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Create a new policy (Admin/Agent only)
const createPolicy = async (req, res) => {
  try {
    const { policyName, premium, startDate, endDate, customerId } = req.body;

    const customer = await prisma.user.findUnique({
      where: { id: Number(customerId) },
    });

    if (!customer || customer.role !== "CUSTOMER") {
      return res.status(400).json({ message: "Invalid customer" });
    }

    const policy = await prisma.policy.create({
      data: {
        policyName,
        premium,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        customerId: Number(customerId),
      },
    });

    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all policies (Admin/Agent) — customer sees only their own
const getAllPolicies = async (req, res) => {
  try {
    let policies;

    if (req.user.role === "CUSTOMER") {
      policies = await prisma.policy.findMany({
        where: { customerId: req.user.id },
        include: { customer: { select: { id: true, name: true, email: true } } },
      });
    } else {
      policies = await prisma.policy.findMany({
        include: { customer: { select: { id: true, name: true, email: true } } },
      });
    }

    res.status(200).json(policies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single policy
const getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await prisma.policy.findUnique({
      where: { id: Number(id) },
      include: { customer: { select: { id: true, name: true, email: true } }, claims: true },
    });

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    // Customers can only view their own policy
    if (req.user.role === "CUSTOMER" && policy.customerId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get only active policies
const getActivePolicies = async (req, res) => {
  try {
    const policies = await prisma.policy.findMany({
      where: { status: "ACTIVE" },
      include: { customer: { select: { id: true, name: true, email: true } } },
    });
    res.status(200).json(policies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Renew policy (extend endDate, set status back to ACTIVE)
const renewPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEndDate } = req.body;

    const policy = await prisma.policy.update({
      where: { id: Number(id) },
      data: {
        endDate: new Date(newEndDate),
        status: "ACTIVE",
      },
    });

    res.status(200).json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel policy
const cancelPolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await prisma.policy.update({
      where: { id: Number(id) },
      data: { status: "CANCELLED" },
    });

    res.status(200).json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPolicy,
  getAllPolicies,
  getPolicyById,
  getActivePolicies,
  renewPolicy,
  cancelPolicy,
};
