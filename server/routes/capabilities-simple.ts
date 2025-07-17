import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const router = Router();

// Configure simple multer
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Ultra-simple upload endpoint
router.post("/simple-upload", upload.single('document'), async (req, res) => {
  console.log("=== SIMPLE UPLOAD ===");
  console.log("File:", req.file);
  console.log("Session:", !!req.session);
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Clean up
    await fs.unlink(req.file.path).catch(() => {});
    
    res.json({
      message: "Upload successful",
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error("Simple upload error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
});

export default router;