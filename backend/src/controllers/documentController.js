const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const path = require("path");
const fs = require("fs");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Upload a document and attach it to a claim
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { claimId } = req.body;
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    if (claimId) {
      const claim = await prisma.claim.findUnique({
        where: { id: Number(claimId) },
      });

      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }

      if (req.user.role === "CUSTOMER" && claim.customerId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await prisma.claim.update({
        where: { id: Number(claimId) },
        data: { documentUrl: fileUrl },
      });
    }

    res.status(201).json({
      message: "Document uploaded successfully",
      fileName: req.file.filename,
      fileUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download / view a document
const getDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../../uploads/documents", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadDocument, getDocument };
