import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

const PRIVY_APP_ID = process.env.PRIVY_APP_ID
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET
const PRIVY_PUBLIC_KEY = process.env.PRIVY_PUBLIC_KEY

if (!PRIVY_APP_ID || !PRIVY_APP_SECRET || !PRIVY_PUBLIC_KEY) {
  throw new Error('Missing Privy environment variables')
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const RDS_ENDPOINT = process.env.RDS_ENDPOINT
const RDS_PORT = process.env.RDS_PORT
const RDS_USERNAME = process.env.RDS_USERNAME
const RDS_PASSWORD = process.env.RDS_PASSWORD
const RDS_CA = process.env.RDS_CA

if (!RDS_ENDPOINT || !RDS_PORT || !RDS_USERNAME || !RDS_PASSWORD || !RDS_CA) {
  throw new Error('Missing RDS environment variables')
}

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
  throw new Error('Missing AWS environment variables')
}

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME

if (!S3_BUCKET_NAME) {
  throw new Error('Missing S3 bucket name')
}

const ROLE_ARN = process.env.ROLE_ARN || 'arn:aws:iam::209479298568:role/constella-lambda-role'

if (!ROLE_ARN) {
  throw new Error('Missing role ARN')
}

const RUST_BINARY_PATH = process.env.RUST_BINARY_PATH
if (!RUST_BINARY_PATH) {
  throw new Error('Missing rust binary path')
}

export default {
  PORT,
  FRONTEND_URL,
  PRIVY_APP_ID,
  PRIVY_APP_SECRET,
  PRIVY_PUBLIC_KEY,
  JWT_SECRET,
  RDS_ENDPOINT,
  RDS_PORT,
  RDS_USERNAME,
  RDS_PASSWORD,
  RDS_CA,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  S3_BUCKET_NAME,
  ROLE_ARN,
  RUST_BINARY_PATH,
}
