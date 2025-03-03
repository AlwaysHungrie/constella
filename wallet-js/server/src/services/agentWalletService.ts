import prisma from '../prisma'
import { setupRdsDatabase } from './rdsService'

export const createAgentWallet = async (
  userAddress: string,
  domain: string,
  systemPrompt: string
) => {
  // create a db for this agent
  console.log(userAddress, domain, systemPrompt)
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

