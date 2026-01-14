import express from "express";
const router = express.Router();

import
    {
        getAllClasses,
        getClassById,
        createClass,
        updateClass,
        deleteClass,
        getClassStudents,
    } from "../controllers/classController.js";

import { authenticate, authorize } from "../middleware/auth.js";

// Routes pour la gestion des classes
router.get("/", authenticate, getAllClasses);

// IMPORTANT: route spécifique AVANT "/:id"
router.get(
    "/:id/etudiants",
    authenticate,
    authorize(["admin", "teacher"]),
    getClassStudents
);

// Détails: une classe spécifique par son ID
router.get("/:id", authenticate, getClassById);

// Créer, modifier et supprimer une classe (admin only)
router.post("/", authenticate, authorize(["admin"]), createClass);
router.put("/:id", authenticate, authorize(["admin"]), updateClass);
router.delete("/:id", authenticate, authorize(["admin"]), deleteClass);

export default router;
