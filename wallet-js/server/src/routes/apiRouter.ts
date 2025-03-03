import express from 'express'
import authRouter from './authRoutes'
import userRouter from './userRouter'

const router = express.Router()

router.use('/auth', authRouter)
router.use('/user', userRouter)

// Global error handling middleware
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Auth Error:', err)

  // Default to 500 if no status code is set
  const status = err.status || err.statusCode || 500
  const message = err.expose ? err.message : 'An unexpected error occurred'

  res.status(status).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }), // Include validation errors if present
  })
})

export default router;