import prisma from '../prisma'
import { generateNonce } from '../utils/random'

export const createUser = async (privyUserId: string, address: string) => {
  const nonce = generateNonce()
  const user = await prisma.user.create({
    data: {
      privyUserId,
      userAddress: address,
      nonce,
    },
  })
  return user
}

export const getUserByAddress = async (userAddress: string) => {
  const user = await prisma.user.findUnique({
    where: { userAddress },
  })
  return user
}

export const getUserByPrivyId = async (privyUserId: string) => {
  const user = await prisma.user.findUnique({
    where: { privyUserId },
  })
  return user
}

export const deleteUser = async (userAddress: string) => {
  const agentWallets = await prisma.agentWallet.findMany({
    where: { creatorAddress: userAddress },
  })

  const agentFunctions = await prisma.agentFunction.deleteMany({
    where: {
      agentWalletAddress: {
        in: agentWallets.map((agentWallet) => agentWallet.walletAddress),
      },
    },
  })

  console.log('deleted agentWallets', agentWallets)
  console.log('deleted agentFunctions', agentFunctions)

  await prisma.agentWallet.deleteMany({
    where: { creatorAddress: userAddress },
  })

  await prisma.user.delete({ where: { userAddress } })
}
