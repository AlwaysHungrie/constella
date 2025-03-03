import crypto from 'crypto'
import { ethers, isHexString } from 'ethers'

export const generateNonce = () => {
  return crypto.randomBytes(32).toString('hex')
}

export const generateDbCredentials = (address: string, privateKey: string) => {
  const base64Address = Buffer.from(address).toString('base64')
  const base64PrivateKey = Buffer.from(privateKey).toString('base64')
  return {
    dbName: base64Address,
    dbUser: base64Address,
    dbPassword: base64PrivateKey,
  }
}

export const generateWalletHash = async (nonce: string, domain: string, systemPrompt: string) => {
  const hash = crypto.createHash('sha256')
  hash.update(nonce)
  hash.update(domain)
  hash.update(systemPrompt)
  return hash.digest('hex')
}

export const generateWallet = async (walletHash: string) => {
  // Create a SHA256 hash of the input string to get 32 bytes
  let privateKey = crypto.createHash('sha256').update(walletHash).digest('hex')
  
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  
  if (privateKey.length > 66) {
    privateKey = privateKey.slice(0, 66)
  } else if (privateKey.length < 66) {
    privateKey = privateKey.padEnd(66, '0')
  }
  
  if (!isHexString(privateKey, 32)) {
    throw new Error('Invalid wallet hash, must be 32 bytes')
  }

  const wallet = new ethers.Wallet(privateKey)
  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
  }
}
