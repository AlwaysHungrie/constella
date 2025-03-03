import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

export default {
  PORT,
  FRONTEND_URL,
}