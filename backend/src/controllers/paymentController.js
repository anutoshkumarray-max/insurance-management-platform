const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Create a premium payment due entry (Admin/Agent)
const createPayment = async (req, res) => {
  try {
    const { policyId, amount, dueDate } = req.body;

    const policy = await prisma.policy.findUnique({
      where: { id: Number(policyId) },
    });

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    const payment = await prisma.payment.create({
      data: {
        amount,
        dueDate: new Date(dueDate),
        policyId: Number(policyId),
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payments (Admin/Agent see all, Customer sees own policy payments)
const getAllPayments = async (req, res) => {
  try {
    let payments;

    if (req.user.role === "CUSTOMER") {
      payments = await prisma.payment.findMany({
        where: { policy: { customerId: req.user.id } },
        include: { policy: true },
        orderBy: { dueDate: "asc" },
      });
    } else {
      payments = await prisma.payment.findMany({
        include: {
          policy: { include: { customer: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { dueDate: "asc" },
      });
    }

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark a payment as paid (Customer pays, or Admin/Agent records it)
const markPaymentPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.update({
      where: { id: Number(id) },
      data: {
        status: "PAID",
        paidDate: new Date(),
      },
    });

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get overdue payments (Admin/Agent only)
const getOverduePayments = async (req, res) => {
  try {
    const overdue = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        dueDate: { lt: new Date() },
      },
      include: {
        policy: { include: { customer: { select: { id: true, name: true, email: true } } } },
      },
    });

    // Auto-mark them OVERDUE
    await prisma.payment.updateMany({
      where: {
        status: "PENDING",
        dueDate: { lt: new Date() },
      },
      data: { status: "OVERDUE" },
    });

    res.status(200).json(overdue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Payment history for a specific policy
const getPaymentHistoryByPolicy = async (req, res) => {
  try {
    const { policyId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { policyId: Number(policyId) },
      orderBy: { dueDate: "asc" },
    });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  markPaymentPaid,
  getOverduePayments,
  getPaymentHistoryByPolicy,
};
