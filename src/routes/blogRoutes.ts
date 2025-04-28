import express from "express";
import {
  createBlog,
  getMyBlogs,
  getMyJoinedBlogs,
  getBlogInfo,
  updateBlog,
  deleteBlog,
  searchBlogs,
  joinBlog,
  leaveBlog,
  getBlogUsers,
} from "../controllers/blogController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.use(authenticate);

router.post("/create", createBlog);
router.get("/get-my-blogs", getMyBlogs);
router.get("/get-my-joined-blogs", getMyJoinedBlogs);
router.get("/get-blog-info/:id", getBlogInfo);
router.put("/update/:id", updateBlog);
router.delete("/delete/:id", deleteBlog);
router.get("/search", searchBlogs);
router.post("/join-blog/:id", joinBlog);
router.delete("/leave-blog/:id", leaveBlog);
router.get("/get-users/:id", getBlogUsers);

export default router;
