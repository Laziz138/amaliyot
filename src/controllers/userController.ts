import type { Request, Response } from "express"
import { pool } from "../index"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Barcha maydonlar to'ldirilishi shart" })
    }

    const userExists = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email])

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Bunday foydalanuvchi nomi yoki email allaqachon mavjud" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword],
    )

    res.status(201).json({
      message: "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi",
      user: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email va parol kiritilishi shart" })
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Noto'g'ri ma'lumotlar kiritildi" })
    }

    const user = result.rows[0]
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Noto'g'ri ma'lumotlar kiritildi" })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "24h" })

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    })

    res.status(200).json({
      message: "Tizimga muvaffaqiyatli kirildi",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error })
  }
}
