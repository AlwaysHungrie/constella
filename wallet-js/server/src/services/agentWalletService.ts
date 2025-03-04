import prisma from '../prisma'
import { setupRdsDatabase } from './rdsService'
import config from '../config'
import { generateDbUrls } from '../utils/random'

const { RDS_ENDPOINT, RDS_PORT } = config

export const createAgentWallet = async (
  walletAddress: string,
  privateKey: string,
  userAddress: string,
  domain: string,
  systemPrompt: string
) => {
  const { dbName, dbUser, dbPassword } = await setupRdsDatabase(
    walletAddress,
    privateKey
  )

  const agentWallet = await prisma.agentWallet.create({
    data: {
      walletAddress,
      privateKey,

      creatorAddress: userAddress,

      domain: domain,
      systemPrompt: systemPrompt,

      dbHost: RDS_ENDPOINT,
      dbName,
      dbUser,
      dbPassword,
      dbPort: parseInt(RDS_PORT),

      updatedAt: new Date(),
    },
  })

  const { connectionString, shadowConnectionString } = generateDbUrls(
    dbName,
    dbUser,
    dbPassword,
    RDS_ENDPOINT,
    parseInt(RDS_PORT)
  )

  return {
    agentWallet,
    connectionString,
    shadowConnectionString,
  }
}

export const deleteAgentWallet = async (walletAddress: string) => {
  const agentFunctions = await prisma.agentFunction.deleteMany({
    where: {
      agentWalletAddress: {
        in: [walletAddress],
      },
    },
  })

  console.log('deleted agentFunctions', agentFunctions)

  const agentWallet = await prisma.agentWallet.delete({
    where: {
      walletAddress,
    },
  })

  console.log('deleted agentWallet', agentWallet)
}

