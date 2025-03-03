import express from 'express'

import { deleteUser, getUserByAddress } from '../services/userService'
import { asyncHandler } from '../middleware/misc'
import { AuthenticatedRequest, jwtMiddleware } from '../middleware/jwt'
import createError from 'http-errors'
const router = express.Router()

router.delete(
  '/',
  jwtMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const user = await getUserByAddress(req.user.address)
    if (!user) {
      throw createError(404, 'User not found')
    }
    await deleteUser(user.id)
    res.json({ success: true })
  })
)

export default router
