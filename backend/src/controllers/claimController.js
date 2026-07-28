const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Submit a new claim (Customer only, for their own policy)
const submitClaim = async (req, res) => {
  try {
    const { policyId, description, documentUrl } = req.body;

    const policy = await prisma.policy.findUnique({
      where: { id: Number(policyId) },
    });

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    // Customer can only claim on their own policy
    if (req.user.role === "CUSTOMER" && policy.customerId !== req.user.id) {
      return res.status(403).json({ message: "This is not your policy" });
    }

    if (policy.status !== "ACTIVE") {
      return res.status(400).json({ message: "Cannot claim on an inactive policy" });
    }

    const claim = await prisma.claim.create({
      data: {
        description,
        documentUrl: documentUrl || null,
        policyId: Number(policyId),
        customerId: policy.customerId,
      },
    });

    res.status(201).json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all claims (Admin/Agent see all, Customer sees own)
const getAllClaims = async (req, res) => {
  try {
    let claims;

    if (req.user.role === "CUSTOMER") {
      claims = await prisma.claim.findMany({
        where: { customerId: req.user.id },
        include: { policy: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      claims = await prisma.claim.findMany({
        include: {
          policy: true,
          customer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single claim
const getClaimById = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await prisma.claim.findUnique({
      where: { id: Number(id) },
      include: {
        policy: true,
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (req.user.role === "CUSTOMER" && claim.customerId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve claim (Admin/Agent only)
const approveClaim = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await prisma.claim.update({
      where: { id: Number(id) },
      data: { status: "APPROVED" },
    });

    res.status(200).json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject claim (Admin/Agent only)
const rejectClaim = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await prisma.claim.update({
      where: { id: Number(id) },
      data: { status: "REJECTED" },
    });

    res.status(200).json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Claim statistics (Admin/Agent only) — for reports dashboard later
const getClaimStats = async (req, res) => {
  try {
    const total = await prisma.claim.count();
    const pending = await prisma.claim.count({ where: { status: "PENDING" } });
    const approved = await prisma.claim.count({ where: { status: "APPROVED" } });
    const rejected = await prisma.claim.count({ where: { status: "REJECTED" } });

    res.status(200).json({ total, pending, approved, rejected });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitClaim,
  getAllClaims,
  getClaimById,
  approveClaim,
  rejectClaim,
  getClaimStats,
};
