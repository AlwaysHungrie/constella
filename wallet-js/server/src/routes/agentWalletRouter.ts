import express from 'express'

import { asyncHandler } from '../middleware/misc'
import { AuthenticatedRequest, jwtMiddleware } from '../middleware/jwt'
import createError from 'http-errors'
import { getUserByAddress } from '../services/userService'
import { handleValidationErrors } from '../middleware/validation'
import { body } from 'express-validator'
import { generateDbUrls, generateWallet } from '../utils/random'
import prisma from '../prisma'
import { deleteRdsDatabase } from '../services/rdsService'
import {
  createAgentWallet,
  deleteAgentWallet,
} from '../services/agentWalletService'
const router = express.Router()

import config from '../config'
import { createDeploymentPackage } from '../services/functionService'
import { cleanupTempFiles, uploadToS3 } from '../utils/fileUtils'
import {
  Architecture,
  CreateFunctionCommand,
  Lambda,
  PackageType,
  Runtime,
  UpdateFunctionCodeCommand,
} from '@aws-sdk/client-lambda'
import { ethers } from 'ethers'

const {
  RDS_PORT,
  RDS_ENDPOINT,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  S3_BUCKET_NAME,
  ROLE_ARN,
} = config

const region = AWS_REGION || 'us-east-1'
const lambda = new Lambda({
  region,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
})

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
    const { privateKey, address: walletAddress } = await generateWallet(
      user.nonce,
      req.body.domain,
      req.body.systemPrompt
    )

    const checkWalletExists = await prisma.agentWallet.findUnique({
      where: {
        walletAddress,
      },
    })

    if (checkWalletExists) {
      const { connectionString, shadowConnectionString } = generateDbUrls(
        checkWalletExists.dbName,
        checkWalletExists.dbUser,
        checkWalletExists.dbPassword,
        RDS_ENDPOINT,
        parseInt(RDS_PORT)
      )

      return res.status(400).json({
        success: false,
        message: 'Wallet already exists',
        agentWallet: checkWalletExists,
        connectionString,
        shadowConnectionString,
      })
    }

    const { agentWallet, connectionString, shadowConnectionString } =
      await createAgentWallet(
        walletAddress,
        privateKey,
        user.userAddress,
        req.body.domain,
        req.body.systemPrompt
      )

    return res.status(200).json({
      success: true,
      message: 'Agent wallet created',
      agentWallet,
      connectionString,
      shadowConnectionString,
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

router.post(
  '/:walletAddress/function',
  jwtMiddleware,
  body('functionName').isString().notEmpty(),
  body('githubUrl').isString().notEmpty(),
  body('envVariables').isObject(),
  handleValidationErrors,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    let filesToCleanup: string[] = []
    try {
      const { walletAddress } = req.params
      const { functionName, githubUrl, envVariables } = req.body

      const agentWallet = await prisma.agentWallet.findUnique({
        where: {
          walletAddress,
        },
      })

      if (!agentWallet) {
        throw createError(404, 'Agent wallet not found')
      }

      if (agentWallet.creatorAddress !== req.user.address) {
        throw createError(403, 'You are not authorized to deploy this function')
      }

      const { connectionString, shadowConnectionString } = generateDbUrls(
        agentWallet.dbName,
        agentWallet.dbUser,
        agentWallet.dbPassword,
        RDS_ENDPOINT,
        parseInt(RDS_PORT)
      )

      const { zipFilePath, tempDirPath } = await createDeploymentPackage(
        githubUrl,
        functionName,
        envVariables,
        connectionString,
        shadowConnectionString
      )

      filesToCleanup.push(zipFilePath)
      filesToCleanup.push(tempDirPath)

      const s3Key = await uploadToS3(zipFilePath, functionName)

      // Check if function already exists and update or create accordingly

      // List existing functions to check if it exists
      const functions = await lambda.listFunctions({})
      const functionExists = functions.Functions?.some(
        (fn) => fn.FunctionName === functionName
      )

      if (functionExists) {
        // Update existing function using S3
        await lambda.send(
          new UpdateFunctionCodeCommand({
            FunctionName: functionName,
            S3Bucket: S3_BUCKET_NAME,
            S3Key: s3Key,
            Architectures: [Architecture.arm64],
          })
        )

        res.json({
          success: true,
          message: 'Lambda function updated successfully',
          functionName,
          agentWallet,
        })
        return
      }

      // Create new function using S3
      await lambda.send(
        new CreateFunctionCommand({
          FunctionName: functionName,
          Role: ROLE_ARN,
          Code: {
            S3Bucket: S3_BUCKET_NAME,
            S3Key: s3Key,
          },
          Description: `Lambda function deployed on ${new Date().toISOString()}`,
          Architectures: [Architecture.arm64],
          Handler: 'index.handler',
          Timeout: 10,
          MemorySize: 128,
          PackageType: PackageType.Zip,
          Runtime: Runtime.nodejs16x,
        })
      )

      res.json({
        success: true,
        message: 'Lambda function created successfully',
        functionName,
        agentWallet,
      })
    } catch (error) {
      throw error
    } finally {
      await cleanupTempFiles(filesToCleanup)
    }
  })
)

router.post(
  '/:walletAddress/executeTxn',
  jwtMiddleware,
  body('transaction').isObject(),
  handleValidationErrors,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { walletAddress } = req.params
    const { transaction } = req.body

    const { txnRequest, rpcUrl } = transaction
    if (!txnRequest || !rpcUrl) {
      throw createError(400, 'Invalid transaction request')
    }

    const agentWallet = await prisma.agentWallet.findUnique({
      where: {
        walletAddress,
      },
    })

    if (!agentWallet) {
      throw createError(404, 'Agent wallet not found')
    }

    if (agentWallet.creatorAddress !== req.user.address) {
      throw createError(
        403,
        'You are not authorized to execute this transaction'
      )
    }

    console.log('rpcUrl', rpcUrl)
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const network = await provider.getNetwork()
    console.log('network', network)
    console.log('provider', provider)
    const wallet = new ethers.Wallet(agentWallet.privateKey, provider)
    console.log('wallet', wallet)

    console.log('txnRequest', txnRequest)
    const data = txnRequest.data
    console.log('data.length', data.length)

    const txn = await wallet.sendTransaction({
      from: wallet.address,
      data: txnRequest.data,
    })
    console.log('txn', txn)
    const txnReceipt = await txn.wait()

    res.json({
      success: true,
      message: 'Transaction executed successfully',
      txn,
      txnReceipt,
    })
  })
)

router.post(
  '/:walletAddress/function/:functionName/invoke',
  jwtMiddleware,
  body('payload').isObject(),
  handleValidationErrors,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { walletAddress, functionName } = req.params
    const { payload } = req.body

    const agentWallet = await prisma.agentWallet.findUnique({
      where: {
        walletAddress,
      },
    })

    if (!agentWallet) {
      throw createError(404, 'Agent wallet not found')
    }

    if (agentWallet.creatorAddress !== req.user.address) {
      throw createError(403, 'You are not authorized to invoke this function')
    }

    console.log(`Invoking Lambda function: ${functionName}`)

    // Invoke Lambda function
    const response = await lambda.invoke({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(payload)),
    })

    if (!response.Payload) {
      throw new Error('No payload returned from Lambda function')
    }

    // Parse and return response
    const result = JSON.parse(Buffer.from(response.Payload).toString())

    // execute transaction if present

    if (result.transaction) {
      const { txnRequest, rpcUrl } = result.transaction
      if (!txnRequest || !rpcUrl) {
        throw createError(400, 'Invalid transaction request')
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl)
      const wallet = new ethers.Wallet(agentWallet.privateKey, provider)
      const txnData = {
        from: wallet.address,
        data: txnRequest.data,
      } as any
      if (txnRequest.to) {
        txnData.to = txnRequest.to
      }
      const txn = await wallet.sendTransaction(txnData)
      const txnReceipt = await txn.wait()

      result.txnReceipt = txnReceipt
      result.txn = txn
    }

    res.json(result)
  })
)
export default router
