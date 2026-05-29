// backend/src/routes/startup.routes.js
import express from "express";
import { generateStartup } from "../controllers/startup.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All startup generator routes require auth
// POST /api/startup/generate
router.post("/generate", protect, generateStartup);

export default router;