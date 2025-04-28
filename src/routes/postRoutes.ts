import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  sortPostsByDate,
  getPostComments,
} from "../controllers/postController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.use(authenticate);

router.post("/create", createPost);
router.get("/get-all/:blogId", getAllPosts);
router.get("/get-by-id/:id", getPostById);
router.put("/update/:id", updatePost);
router.delete("/delete/:id", deletePost);
router.get("/sort-by-date/:blogId", sortPostsByDate);
router.get("/:post_id/get-comments", getPostComments);

export default router;
