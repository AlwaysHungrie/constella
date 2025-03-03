// server.ts
import express, { Request, Response } from 'express'
import {
  Lambda,
  Architecture,
  PackageType,
  Runtime,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
} from '@aws-sdk/client-lambda'
import { IAM } from '@aws-sdk/client-iam'
import { S3, PutObjectCommand } from '@aws-sdk/client-s3'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import archiver from 'archiver'
import { readFile } from 'node:fs/promises'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()
const app = express()
const port = process.env.PORT || 8443

// Configure AWS
const region = process.env.AWS_REGION || 'us-east-1'
const lambda = new Lambda({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const s3 = new S3({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Default role ARN and S3 bucket name
const DEFAULT_ROLE_ARN = process.env.DEFAULT_LAMBDA_ROLE_ARN || 'arn:aws:iam::209479298568:role/constella-lambda-role'
const S3_BUCKET_NAME = 'constella-lambda-deployments'

app.use(express.json())

/**
 * Creates a deployment package for the Lambda function
 * @param sourceFilePath Path to the Lambda function source file
 * @returns Path to the created zip file
 */
async function createDeploymentPackage(sourceFilePath: string): Promise<string> {
  // Create unique temporary directories for each run
  const timestamp = Date.now()
  const tempDir = path.join(__dirname, `../../lambda-temp-${timestamp}`)
  const zipFilePath = path.join(__dirname, `./lambda-function-${timestamp}.zip`)

  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Copy Lambda function code
    fs.writeFileSync(
      path.join(tempDir, 'index.ts'),
      fs.readFileSync(sourceFilePath || path.join(__dirname, '../../lambda.ts'), 'utf8')
    )

    // Create package.json for Lambda
    const packageJson = {
      name: 'lambda-function',
      version: '1.0.0',
      description: 'Lambda function for API integration',
      main: 'index.js',
      dependencies: {
        axios: '^1.8.1',
      },
      devDependencies: {
        typescript: '^5.8.2',
      },
    }

    const tsConfig = {
      compilerOptions: {
        target: 'es2020',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        outDir: './',
      },
      include: ['*.ts'],
      exclude: ['node_modules'],
    }

    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )

    fs.writeFileSync(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    )

    console.log('Created configuration files')

    // Install dependencies
    execSync('npm install', { cwd: tempDir, stdio: 'pipe' })
    console.log('Installed dependencies')

    // Compile TypeScript
    execSync('npx tsc', { cwd: tempDir, stdio: 'pipe' })
    console.log('Compiled TypeScript')

    // Create zip file
    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    archive.pipe(output)

    // Add the JS file and node_modules
    archive.file(path.join(tempDir, 'index.js'), { name: 'index.js' })
    archive.directory(path.join(tempDir, 'node_modules'), 'node_modules')

    await archive.finalize()

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        resolve()
      })
      archive.on('error', (error) => {
        reject(error)
      })
    })

    console.log(`Created deployment package: ${zipFilePath}`)
    return zipFilePath
  } catch (error) {
    console.error('Error creating deployment package:', error)
    throw error
  }
}

/**
 * Uploads a deployment package to S3
 * @param zipFilePath Path to the zip file
 * @param functionName Name of the Lambda function
 * @returns S3 object key
 */
async function uploadToS3(zipFilePath: string, functionName: string): Promise<string> {
  try {
    const zipFile = await readFile(zipFilePath)
    const s3Key = `lambda-deployments/${functionName}/${path.basename(zipFilePath)}`

    console.log(`Uploading deployment package to S3: ${S3_BUCKET_NAME}/${s3Key}`)

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: zipFile,
    }))

    console.log('Deployment package uploaded to S3 successfully')
    return s3Key
  } catch (error) {
    console.error('Error uploading deployment package to S3:', error)
    throw error
  }
}

/**
 * Verifies that the specified IAM role has Lambda execution permissions
 * @param roleArn ARN of the IAM role
 * @returns True if the role has necessary permissions
 */
async function verifyRolePermissions(roleArn: string): Promise<boolean> {
  try {
    const iam = new IAM({ region })

    // Extract role name from ARN
    const roleName = roleArn.split('/').pop()

    if (!roleName) {
      console.error('Could not extract role name from ARN:', roleArn)
      return false
    }

    console.log(`Verifying permissions for role: ${roleName}`)

    // Get the role
    const roleResponse = await iam.getRole({ RoleName: roleName })
    console.log('Role exists:', roleResponse.Role?.RoleName)

    // Get attached policies
    const attachedPolicies = await iam.listAttachedRolePolicies({
      RoleName: roleName,
    })
    
    console.log(
      'Attached policies:',
      attachedPolicies.AttachedPolicies?.map((p) => p.PolicyName).join(', ')
    )

    // Check for Lambda execution permissions
    const hasLambdaExecution = attachedPolicies.AttachedPolicies?.some(
      (policy) =>
        policy.PolicyName?.includes('Lambda') ||
        policy.PolicyName?.includes('lambda')
    )

    if (!hasLambdaExecution) {
      console.warn('Warning: No Lambda execution policy found attached to the role')
    }

    return true
  } catch (error) {
    console.error('Error verifying role permissions:', error)
    return false
  }
}

/**
 * Cleans up temporary files created during deployment
 * @param filePaths Array of file paths to clean up
 */
async function cleanupTempFiles(filePaths: string[]): Promise<void> {
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

// Route to create or update a Lambda function
app.post('/create-lambda', async (req: Request, res: Response) => {
  console.log('Creating/updating Lambda function')
  
  // Track files to clean up
  const filesToCleanup: string[] = []
  
  try {
    // Extract parameters from request
    const functionName = req.body.functionName || 'defaultLambdaFunction'
    const roleArn = req.body.roleArn || DEFAULT_ROLE_ARN
    const sourceFilePath = req.body.sourceFilePath || path.join(__dirname, '../../lambda.ts')
    
    console.log(`Function name: ${functionName}`)
    console.log(`Role ARN: ${roleArn}`)

    // Verify role permissions
    const hasLambdaExecution = await verifyRolePermissions(roleArn)
    if (!hasLambdaExecution) {
      console.error('Error: Role does not have Lambda execution permissions')
      res.status(500).json({
        error: 'Role does not have Lambda execution permissions',
      })
      return
    }

    // Create deployment package
    const zipFilePath = await createDeploymentPackage(sourceFilePath)
    filesToCleanup.push(zipFilePath)
    
    // Extract the temp directory path from the zip path
    const tempDirPath = zipFilePath.replace('.zip', '').replace(path.join(__dirname, './lambda-function-'), path.join(__dirname, '../../lambda-temp-'))
    filesToCleanup.push(tempDirPath)
    
    // Upload the deployment package to S3
    const s3Key = await uploadToS3(zipFilePath, functionName)

    // Check if function already exists and update or create accordingly
    try {
      // List existing functions to check if it exists
      const functions = await lambda.listFunctions({})
      const functionExists = functions.Functions?.some(fn => fn.FunctionName === functionName)

      if (functionExists) {
        // Update existing function using S3
        const updateFunctionCodeResponse = await lambda.send(new UpdateFunctionCodeCommand({
          FunctionName: functionName,
          S3Bucket: S3_BUCKET_NAME,
          S3Key: s3Key,
          Architectures: [Architecture.arm64],
        }))
        
        console.log('Lambda function updated successfully')
        res.json({
          message: 'Lambda function updated successfully',
          functionName,
          functionArn: updateFunctionCodeResponse.FunctionArn,
          s3Location: {
            bucket: S3_BUCKET_NAME,
            key: s3Key
          }
        })
      } else {
        // Create new function using S3
        const createFunctionResponse = await lambda.send(new CreateFunctionCommand({
          FunctionName: functionName,
          Role: roleArn,
          Code: {
            S3Bucket: S3_BUCKET_NAME,
            S3Key: s3Key
          },
          Description: `Lambda function deployed on ${new Date().toISOString()}`,
          Architectures: [Architecture.arm64],
          Handler: 'index.handler',
          Timeout: 10,
          MemorySize: 128,
          PackageType: PackageType.Zip,
          Runtime: Runtime.nodejs16x,
        }))
        
        console.log('Lambda function created successfully')
        res.json({
          message: 'Lambda function created successfully',
          functionName,
          functionArn: createFunctionResponse.FunctionArn,
          s3Location: {
            bucket: S3_BUCKET_NAME,
            key: s3Key
          }
        })
      }
    } catch (error) {
      console.error('Error creating/updating Lambda function:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in create-lambda endpoint:', error)
    let errorDetails = 'Unknown error'
    if (error instanceof Error) {
      errorDetails = error.message
    }

    res.status(500).json({
      error: 'Failed to create/update Lambda function',
      details: errorDetails,
    })
  } finally {
    // Clean up temporary files
    await cleanupTempFiles(filesToCleanup)
  }
})

// Route to invoke a Lambda function
app.post('/call-lambda', async (req: Request, res: Response) => {
  try {
    const functionName = req.body.functionName || 'defaultLambdaFunction'
    const payload = req.body.payload || {}

    console.log(`Invoking Lambda function: ${functionName}`)

    // Invoke Lambda function
    const response = await lambda.invoke({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(payload)),
    })

    if (!response.Payload) {
      throw new Error('No payload returned from Lambda function')
    }

    // Parse and return response
    const result = JSON.parse(Buffer.from(response.Payload).toString())
    res.json(result)
  } catch (error) {
    console.error('Error invoking Lambda function:', error)
    let errorDetails = 'Unknown error'
    if (error instanceof Error) {
      errorDetails = error.message
    }

    res.status(500).json({
      error: 'Failed to invoke Lambda function',
      details: errorDetails,
    })
  }
})

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    message: 'Lambda deployment server is running',
    version: '1.0.0'
  })
})

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})