import crypto from 'crypto'

export const generateNonce = () => {
  return crypto.randomBytes(32).toString('hex')
}
