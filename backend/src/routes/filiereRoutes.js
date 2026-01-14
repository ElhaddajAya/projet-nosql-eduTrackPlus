import express from "express";
const router = express.Router();

import { getAllFilieres } from "../controllers/filiereController.js";
import { authenticate, authorize } from "../middleware/auth.js";

router.get("/", authenticate, authorize(["admin"]), getAllFilieres);

export default router;
