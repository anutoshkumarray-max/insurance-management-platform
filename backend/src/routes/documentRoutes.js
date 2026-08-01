const express = require("express");
const { uploadDocument, getDocument } = require("../controllers/documentController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../config/multerConfig");

const router = express.Router();

router.post("/upload", protect, upload.single("document"), uploadDocument);
router.get("/:filename", getDocument);

module.exports = router;
