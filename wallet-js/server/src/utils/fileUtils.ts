import fs from 'fs'
import path from 'path'
import { readFile } from 'node:fs/promises'
import { S3, PutObjectCommand } from '@aws-sdk/client-s3'
import config from '../config'

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME } =
  config
const region = AWS_REGION || 'us-east-1'

const s3 = new S3({
  region,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
})

/**
 * Cleans up temporary files created during deployment
 * @param filePaths Array of file paths to clean up
 */
export async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true })
        } else {
          fs.unlinkSync(filePath)
        }
        console.log(`Cleaned up: ${filePath}`)
      }
    } catch (error) {
      console.error(`Error cleaning up ${filePath}:`, error)
    }
  }
}

/**
 * Uploads a deployment package to S3
 * @param zipFilePath Path to the zip file
 * @param functionName Name of the Lambda function
 * @returns S3 object key
 */
export async function uploadToS3(
  zipFilePath: string,
  functionName: string
): Promise<string> {
  try {
    const zipFile = await readFile(zipFilePath)
    const s3Key = `lambda-deployments/${functionName}/${path.basename(
      zipFilePath
    )}`

    console.log(
      `Uploading deployment package to S3: ${S3_BUCKET_NAME}/${s3Key}`
    )

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        Body: zipFile,
      })
    )

    console.log('Deployment package uploaded to S3 successfully')
    return s3Key
  } catch (error) {
    console.log('Error uploading deployment package to S3:', error)
    throw error
  }
}
