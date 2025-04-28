import type { Request, Response } from "express"
import { pool } from "../index"

export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body
    const userId = req.userId

    if (!title) {
      return res.status(400).json({ message: "Sarlavha kiritilishi shart" })
    }

    const result = await pool.query("INSERT INTO blogs (title, description, user_id) VALUES ($1, $2, $3) RETURNING *", [
      title,
      description,
      userId,
    ])

    res.status(201).json({
      message: "Blog muvaffaqiyatli yaratildi",
      blog: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const getMyBlogs = async (req: Request, res: Response) => {
  try {
    const userId = req.userId

    const result = await pool.query("SELECT * FROM blogs WHERE user_id = $1 ORDER BY created_at DESC", [userId])

    res.status(200).json({
      blogs: result.rows,
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const getMyJoinedBlogs = async (req: Request, res: Response) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT b.* FROM blogs b
       JOIN blog_members bm ON b.id = bm.blog_id
       WHERE bm.user_id = $1
       ORDER BY bm.joined_at DESC`,
      [userId],
    )

    res.status(200).json({
      blogs: result.rows,
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const getBlogInfo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT b.*, u.username as owner_name, 
       (SELECT COUNT(*) FROM blog_members WHERE blog_id = $1) as member_count,
       (SELECT COUNT(*) FROM posts WHERE blog_id = $1) as post_count
       FROM blogs b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Blog topilmadi" })
    }

    res.status(200).json({
      blog: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, description } = req.body
    const userId = req.userId

    if (!title) {
      return res.status(400).json({ message: "Sarlavha kiritilishi shart" })
    }

    const blogCheck = await pool.query("SELECT * FROM blogs WHERE id = $1", [id])

    if (blogCheck.rows.length === 0) {
      return res.status(404).json({ message: "Blog topilmadi" })
    }

    if (blogCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Siz faqat o'zingizning bloglaringizni tahrirlashingiz mumkin" })
    }

    const result = await pool.query(
      "UPDATE blogs SET title = $1, description = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
      [title, description, id, userId],
    )

    res.status(200).json({
      message: "Blog muvaffaqiyatli yangilandi",
      blog: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const blogCheck = await pool.query("SELECT * FROM blogs WHERE id = $1", [id])

    if (blogCheck.rows.length === 0) {
      return res.status(404).json({ message: "Blog topilmadi" })
    }

    if (blogCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Siz faqat o'zingizning bloglaringizni o'chirishingiz mumkin" })
    }

    await pool.query("DELETE FROM blogs WHERE id = $1 AND user_id = $2", [id, userId])

    res.status(200).json({
      message: "Blog muvaffaqiyatli o'chirildi",
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const searchBlogs = async (req: Request, res: Response) => {
  try {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({ message: "Qidiruv so'rovi kiritilishi shart" })
    }

    const result = await pool.query(
      `SELECT b.*, u.username as owner_name
       FROM blogs b
       JOIN users u ON b.user_id = u.id
       WHERE b.title ILIKE $1
       ORDER BY b.created_at DESC`,
      [`%${query}%`],
    )

    res.status(200).json({
      blogs: result.rows,
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const joinBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const blogCheck = await pool.query("SELECT * FROM blogs WHERE id = $1", [id])

    if (blogCheck.rows.length === 0) {
      return res.status(404).json({ message: "Blog topilmadi" })
    }

    if (blogCheck.rows[0].user_id === userId) {
      return res.status(400).json({ message: "Siz allaqachon ushbu blogning egasisiz" })
    }

    const memberCheck = await pool.query("SELECT * FROM blog_members WHERE blog_id = $1 AND user_id = $2", [id, userId])

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ message: "Siz allaqachon ushbu blogning a'zosisiz" })
    }

    await pool.query("INSERT INTO blog_members (blog_id, user_id) VALUES ($1, $2)", [id, userId])

    res.status(200).json({
      message: "Blogga muvaffaqiyatli a'zo bo'ldingiz",
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const leaveBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const memberCheck = await pool.query("SELECT * FROM blog_members WHERE blog_id = $1 AND user_id = $2", [id, userId])

    if (memberCheck.rows.length === 0) {
      return res.status(400).json({ message: "Siz ushbu blogning a'zosi emassiz" })
    }

    await pool.query("DELETE FROM blog_members WHERE blog_id = $1 AND user_id = $2", [id, userId])

    res.status(200).json({
      message: "Blogdan muvaffaqiyatli chiqib ketdingiz",
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const getBlogUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const blogCheck = await pool.query("SELECT * FROM blogs WHERE id = $1", [id])

    if (blogCheck.rows.length === 0) {
      return res.status(404).json({ message: "Blog topilmadi" })
    }

    const owner = await pool.query(
      `SELECT u.id, u.username, u.email, 'owner' as role
       FROM users u
       WHERE u.id = $1`,
      [blogCheck.rows[0].user_id],
    )

    const members = await pool.query(
      `SELECT u.id, u.username, u.email, 'member' as role, bm.joined_at
       FROM users u
       JOIN blog_members bm ON u.id = bm.user_id
       WHERE bm.blog_id = $1
       ORDER BY bm.joined_at DESC`,
      [id],
    )

    res.status(200).json({
      owner: owner.rows[0],
      members: members.rows,
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}
