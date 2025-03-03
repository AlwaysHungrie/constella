import express from 'express'
import { asyncHandler } from '../middleware/misc'
import { issueJWT, PrivyAuthenticatedRequest, privyJwtMiddleware } from '../middleware/jwt'
import axios from 'axios'
import config from '../config'
import { createUser, getUserById } from '../services/userService'

const { PRIVY_APP_SECRET, PRIVY_APP_ID } = config

const router = express.Router()

// Route handlers
router.get(
  '/token',
  privyJwtMiddleware,
  asyncHandler(async (req: PrivyAuthenticatedRequest, res: express.Response) => {
    const address = req.query.address as string

    if (!address) {
      res.status(400).json({
        success: false,
        message: 'Address is required as a query parameter',
      })
      return
    }

    const privyUserId = req.user.privyUserId
    console.log('privyUserId', privyUserId)

    const user = await getUserById(privyUserId)
    if (user) {
      if (user?.address !== address) {
        res.status(400).json({
          success: false,
          message: 'Address does not match',
        })
        return
      }

      const token = issueJWT(user)
      res.status(200).json({
        success: true,
        message: 'Token generated successfully',
        token,
      })
      return
    }

    const basicAuth = Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64');
    const response = await axios.get(`https://auth.privy.io/api/v1/users/${privyUserId}`, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'privy-app-id': PRIVY_APP_ID,
      },
    })

    const privyUser = response.data

    const account = privyUser.linked_accounts.find((account: any) => account.address === address)
    if (!account) {
      res.status(400).json({
        success: false,
        message: 'Address not linked to Privy user',
      })
      return
    }

    const newUser = await createUser(privyUserId, address)

    const token = issueJWT(newUser)

    res.status(200).json({
      success: true,
      message: 'New user created successfully',
      token,
    })
  })
)


export default router
