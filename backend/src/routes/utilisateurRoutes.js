// src/routes/utilisateurRoutes.js
import express from "express";
const router = express.Router();

import { authenticate, authorize } from "../middleware/auth.js";
import
{
    createUtilisateur,
    updateUtilisateur,
    deleteUtilisateur,
    getAllUtilisateurs
} from "../controllers/utilisateurController.js";

/**
 * POST /api/utilisateurs
 * admin only
 */
router.post("/", authenticate, authorize(["admin"]), createUtilisateur);

/**
 * PUT /api/utilisateurs/:id
 * admin only (optionnel pour après)
 */
router.put("/:id", authenticate, authorize(["admin"]), updateUtilisateur);

/**
 * DELETE /api/utilisateurs/:id
 * admin only (optionnel pour après)
 */
router.delete("/:id", authenticate, authorize(["admin"]), deleteUtilisateur);

/** GET /api/utilisateurs
 * admin only
 */
router.get("/", authenticate, authorize(["admin"]), getAllUtilisateurs);

export default router;
