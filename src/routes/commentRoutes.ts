import express from "express";
import {
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.use(authenticate);

router.post("/create", createComment);
router.put("/update/:id", updateComment);
router.delete("/delete/:id", deleteComment);

export default router;
