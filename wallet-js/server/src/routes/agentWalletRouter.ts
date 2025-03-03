import express from 'express'

import { asyncHandler } from '../middleware/misc'
import { AuthenticatedRequest, jwtMiddleware } from '../middleware/jwt'
import createError from 'http-errors'
import { getUserByAddress } from '../services/userService'
import { handleValidationErrors } from '../middleware/validation'
import { body } from 'express-validator'
import { generateWallet, generateWalletHash } from '../utils/random'
import prisma from '../prisma'
import { deleteRdsDatabase, setupRdsDatabase } from '../services/rdsService'
import { deleteAgentWallet } from '../services/agentWalletService'
const router = express.Router()

import config from '../config'

const { RDS_PORT } = config

router.post(
  '/',
  jwtMiddleware,
  body('domain').isString().notEmpty(),
  body('systemPrompt').isString().notEmpty(),
  handleValidationErrors,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const user = await getUserByAddress(req.user.address)
    if (!user) {
      throw createError(404, 'User not found')
    }
    const walletHash = await generateWalletHash(user.nonce, req.body.domain, req.body.systemPrompt)
    const { privateKey, address: walletAddress } = await generateWallet(walletHash)

    const checkWalletExists = await prisma.agentWallet.findUnique({
      where: {
        walletAddress,
      },
    })

    if (checkWalletExists) {
      return res.status(400).json({
        success: false,
        message: 'Wallet already exists',
        agentWallet: checkWalletExists,
      })
    }

    const { dbName, dbUser, dbPassword, connectionString } = await setupRdsDatabase(walletAddress, privateKey)
    console.log('created db', dbName, dbUser, dbPassword)

    const agentWallet = await prisma.agentWallet.create({
      data: {
        walletAddress,
        privateKey,

        creatorAddress: user.userAddress,

        domain: req.body.domain,
        systemPrompt: req.body.systemPrompt,
                
        dbHost: connectionString,
        dbName,
        dbUser,
        dbPassword,
        dbPort: parseInt(RDS_PORT),
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Agent wallet created',
      agentWallet,
    })
  })
)

router.delete(
  '/',
  jwtMiddleware,
  body('walletAddress').isString().notEmpty(),
  handleValidationErrors,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { walletAddress } = req.body
    const user = await getUserByAddress(req.user.address)
    if (!user) {
      throw createError(404, 'User not found')
    }

    const agentWallet = await prisma.agentWallet.findUnique({
      where: {
        walletAddress,
      },
    })

    if (!agentWallet) {
      throw createError(404, 'Agent wallet not found')
    }

    await deleteRdsDatabase(agentWallet.dbName, agentWallet.dbUser)
    await deleteAgentWallet(walletAddress)

    return res.status(200).json({
      success: true,
      message: 'Agent wallet deleted',
    })
  })
)

export default router
