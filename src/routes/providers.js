import express from "express";
import {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
} from "../controllers/providers.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getProviders);
router.post("/", createProvider);
router.put("/:id", updateProvider);
router.delete("/:id", deleteProvider);

export default router;
