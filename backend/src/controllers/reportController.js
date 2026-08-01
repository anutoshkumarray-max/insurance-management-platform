const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Overall dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const totalPolicies = await prisma.policy.count();
    const activePolicies = await prisma.policy.count({ where: { status: "ACTIVE" } });
    const expiredPolicies = await prisma.policy.count({ where: { status: "EXPIRED" } });
    const cancelledPolicies = await prisma.policy.count({ where: { status: "CANCELLED" } });

    const totalClaims = await prisma.claim.count();
    const pendingClaims = await prisma.claim.count({ where: { status: "PENDING" } });
    const approvedClaims = await prisma.claim.count({ where: { status: "APPROVED" } });
    const rejectedClaims = await prisma.claim.count({ where: { status: "REJECTED" } });

    const totalPayments = await prisma.payment.count();
    const paidPayments = await prisma.payment.count({ where: { status: "PAID" } });
    const pendingPayments = await prisma.payment.count({ where: { status: "PENDING" } });
    const overduePayments = await prisma.payment.count({ where: { status: "OVERDUE" } });

    const paidAmountAgg = await prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    });

    res.status(200).json({
      customers: { total: totalCustomers },
      policies: {
        total: totalPolicies,
        active: activePolicies,
        expired: expiredPolicies,
        cancelled: cancelledPolicies,
      },
      claims: {
        total: totalClaims,
        pending: pendingClaims,
        approved: approvedClaims,
        rejected: rejectedClaims,
      },
      premiumCollection: {
        totalPayments,
        paid: paidPayments,
        pending: pendingPayments,
        overdue: overduePayments,
        totalAmountCollected: paidAmountAgg._sum.amount || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Monthly business report (policies + claims created per month)
const getMonthlyReport = async (req, res) => {
  try {
    const policies = await prisma.policy.findMany({
      select: { createdAt: true, premium: true },
    });
    const claims = await prisma.claim.findMany({
      select: { createdAt: true, status: true },
    });

    const monthly = {};

    policies.forEach((p) => {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { policiesCreated: 0, totalPremium: 0, claimsCreated: 0 };
      monthly[key].policiesCreated += 1;
      monthly[key].totalPremium += p.premium;
    });

    claims.forEach((c) => {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { policiesCreated: 0, totalPremium: 0, claimsCreated: 0 };
      monthly[key].claimsCreated += 1;
    });

    res.status(200).json(monthly);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Customer growth over time (registrations per month)
const getCustomerGrowth = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { createdAt: true },
    });

    const growth = {};
    customers.forEach((c) => {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
      growth[key] = (growth[key] || 0) + 1;
    });

    res.status(200).json(growth);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardSummary, getMonthlyReport, getCustomerGrowth };
