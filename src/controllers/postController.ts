import type { Request, Response } from "express"
import { pool } from "../index"

export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, blogId } = req.body
    const userId = req.userId

    if (!title || !content || !blogId) {
      return res.status(400).json({ message: "Sarlavha, matn va blog ID kiritilishi shart" })
    }

    const blogCheck = await pool.query("SELECT * FROM blogs WHERE id = $1", [blogId])

    if (blogCheck.rows.length === 0) {
      return res.status(404).json({ message: "Blog topilmadi" })
    }

    if (blogCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Faqat blog egasi post yarata oladi" })
    }

    const result = await pool.query(
      "INSERT INTO posts (title, content, blog_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, content, blogId, userId],
    )

    res.status(201).json({
      message: "Post muvaffaqiyatli yaratildi",
      post: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const { blogId } = req.params

    const blogCheck = await pool.query("SELECT * FROM blogs WHERE id = $1", [blogId])

    if (blogCheck.rows.length === 0) {
      return res.status(404).json({ message: "Blog topilmadi" })
    }

    const result = await pool.query(
      `SELECT p.*, u.username as author_name, 
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.blog_id = $1
       ORDER BY p.created_at DESC`,
      [blogId],
    )

    res.status(200).json({
      posts: result.rows,
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT p.*, u.username as author_name, b.title as blog_title
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN blogs b ON p.blog_id = b.id
       WHERE p.id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post topilmadi" })
    }

    await pool.query("UPDATE posts SET views = views + 1 WHERE id = $1", [id])

    const post = result.rows[0]
    post.views += 1

    res.status(200).json({
      post,
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, content } = req.body
    const userId = req.userId

    if (!title || !content) {
      return res.status(400).json({ message: "Sarlavha va matn kiritilishi shart" })
    }

    const postCheck = await pool.query(
      `SELECT p.*, b.user_id as blog_owner_id
       FROM posts p
       JOIN blogs b ON p.blog_id = b.id
       WHERE p.id = $1`,
      [id],
    )

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: "Post topilmadi" })
    }

    if (postCheck.rows[0].blog_owner_id !== userId) {
      return res.status(403).json({ message: "Faqat blog egasi postni tahrirlashi mumkin" })
    }

    const result = await pool.query("UPDATE posts SET title = $1, content = $2 WHERE id = $3 RETURNING *", [
      title,
      content,
      id,
    ])

    res.status(200).json({
      message: "Post muvaffaqiyatli yangilandi",
      post: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const postCheck = await pool.query(
      `SELECT p.*, b.user_id as blog_owner_id
       FROM posts p
       JOIN blogs b ON p.blog_id = b.id
       WHERE p.id = $1`,
      [id],
    )

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: "Post topilmadi" })
    }

    if (postCheck.rows[0].blog_owner_id !== userId) {
      return res.status(403).json({ message: "Faqat blog egasi postni o'chira oladi" })
    }

    await pool.query("DELETE FROM posts WHERE id = $1", [id])

    res.status(200).json({
      message: "Post muvaffaqiyatli o'chirildi",
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const sortPostsByDate = async (req: Request, res: Response) => {
  try {
    const { blogId } = req.params

    const blogCheck = await pool.query("SELECT * FROM blogs WHERE id = $1", [blogId])

    if (blogCheck.rows.length === 0) {
      return res.status(404).json({ message: "Blog topilmadi" })
    }

    const result = await pool.query(
      `SELECT p.*, u.username as author_name
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.blog_id = $1
       ORDER BY p.created_at DESC`,
      [blogId],
    )

    res.status(200).json({
      posts: result.rows,
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const getPostComments = async (req: Request, res: Response) => {
  try {
    const { post_id } = req.params

    const postCheck = await pool.query("SELECT * FROM posts WHERE id = $1", [post_id])

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: "Post topilmadi" })
    }

    const result = await pool.query(
      `SELECT c.*, u.username as author_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC`,
      [post_id],
    )

    res.status(200).json({
      comments: result.rows,
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}
