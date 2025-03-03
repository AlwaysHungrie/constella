import express from 'express'
import { Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import config from '../config'
import createError from 'http-errors'

const { JWT_SECRET, PRIVY_PUBLIC_KEY } = config

export type AuthenticatedRequest = express.Request & {
  user: {
    id: string
    address: string
  }
}

export type PrivyAuthenticatedRequest = express.Request & {
  user: {
    privyUserId: string
  }
}

// JWT middleware
export const jwtMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    throw createError(401, 'Unauthorized')
  }

  const decoded = jwt.verify(token, JWT_SECRET)
  if (
    !decoded ||
    typeof decoded !== 'object' ||
    !decoded.id ||
    !decoded.address
  ) {
    throw createError(401, 'Unauthorized')
  }

  ;(req as AuthenticatedRequest).user = {
    id: decoded.id,
    address: decoded.address,
  }
  next()
}

export const privyJwtMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    throw createError(401, 'Unauthorized')
  }

  const verified = jwt.verify(token, PRIVY_PUBLIC_KEY, { algorithms: ['ES256'] })
  if (!verified) {
    throw createError(401, 'Unauthorized')
  }

  const decoded = jwt.decode(token)
  ;(req as PrivyAuthenticatedRequest).user = {
    privyUserId: decoded?.sub as string,
  }
  next()
}

export const issueJWT = (
  user: Prisma.UserGetPayload<{
    select: {
      id: true
      address: true
    }
  }>
) => {
  const payload = {
    id: user.id,
    address: user.address,
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}
