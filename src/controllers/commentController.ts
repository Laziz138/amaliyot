import type { Request, Response } from "express"
import { pool } from "../index"

export const createComment = async (req: Request, res: Response) => {
  try {
    const { content, postId } = req.body
    const userId = req.userId

    if (!content || !postId) {
      return res.status(400).json({ message: "Matn va post ID kiritilishi shart" })
    }

    const postCheck = await pool.query("SELECT * FROM posts WHERE id = $1", [postId])

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: "Post topilmadi" })
    }

    const result = await pool.query(
      "INSERT INTO comments (content, post_id, user_id) VALUES ($1, $2, $3) RETURNING *",
      [content, postId, userId],
    )

    res.status(201).json({
      message: "Izoh muvaffaqiyatli yaratildi",
      comment: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const userId = req.userId

    if (!content) {
      return res.status(400).json({ message: "Matn kiritilishi shart" })
    }

    const commentCheck = await pool.query("SELECT * FROM comments WHERE id = $1", [id])

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Izoh topilmadi" })
    }

    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Siz faqat o'zingizning izohlaringizni tahrirlashingiz mumkin" })
    }

    const result = await pool.query("UPDATE comments SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *", [
      content,
      id,
      userId,
    ])

    res.status(200).json({
      message: "Izoh muvaffaqiyatli yangilandi",
      comment: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const commentCheck = await pool.query("SELECT * FROM comments WHERE id = $1", [id])

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Izoh topilmadi" })
    }

    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Siz faqat o'zingizning izohlaringizni o'chirishingiz mumkin" })
    }

    await pool.query("DELETE FROM comments WHERE id = $1 AND user_id = $2", [id, userId])

    res.status(200).json({
      message: "Izoh muvaffaqiyatli o'chirildi",
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}
