import { validationResult } from 'express-validator'
import express from 'express'
import createError from 'http-errors'

// Error handling middleware
export const handleValidationErrors = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    next(
      createError(400, 'Validation error', {
        errors: errors.array().map((err: any) => ({
          field: err.path,
          message: err.msg,
        })),
      })
    )
  }
  next()
}