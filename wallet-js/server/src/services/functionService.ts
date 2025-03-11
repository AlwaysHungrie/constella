import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import archiver from 'archiver'
import { AgentWallet } from '@prisma/client'
import { ethers } from 'ethers'
import createError from 'http-errors'
import { Lambda } from '@aws-sdk/client-lambda'
import config from '../config'

const {
  RDS_PORT,
  RDS_ENDPOINT,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  S3_BUCKET_NAME,
  ROLE_ARN,
} = config

const region = AWS_REGION || 'us-east-1'
const lambda = new Lambda({
  region,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
})

export async function createDeploymentPackage(
  githubUrl: string,
  functionName: string,
  envVariables: Record<string, string>,
  databaseUrl: string,
  shadowDatabaseUrl: string
): Promise<{ zipFilePath: string; tempDirPath: string }> {
  // Create unique temporary directories for each run
  const timestamp = Date.now()
  const tempDir = path.join(__dirname, `../../lambda-temp-${timestamp}`)
  const zipFilePath = path.join(
    __dirname,
    `../lambda-function-${timestamp}.zip`
  )

  const paths = githubUrl.split('/')
  const repoName = paths[paths.length - 1].substring(
    0,
    paths[paths.length - 1].length - 4
  )

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const cloneCommand = `git clone ${githubUrl} && cp -r ${repoName}/${functionName} . && rm -rf ${repoName}`
    execSync(cloneCommand, { 
      cwd: tempDir,
      stdio: 'pipe',
    })

    let envVariablesString = Object.entries(envVariables)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    envVariablesString += `\nDATABASE_URL=${databaseUrl}`
    envVariablesString += `\nSHADOW_DATABASE_URL=${shadowDatabaseUrl}`

    console.log('envVariablesString', envVariablesString)

    // Create .env file
    const envFilePath = path.join(`${tempDir}/${functionName}`, '.env')
    fs.writeFileSync(envFilePath, envVariablesString)

    let migrationRequired = false
    // prisma db pull
    try {
      execSync(`npx prisma db pull`, {
        cwd: `${tempDir}/${functionName}`,
        stdio: 'pipe',
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          SHADOW_DATABASE_URL: shadowDatabaseUrl,
        },
      })
    } catch (error) {
      console.log('db pull error', error)
      migrationRequired = true
    }

    // npm install
    execSync(`cd ${tempDir}/${functionName} && pnpm install`, {
      cwd: tempDir,
      stdio: 'pipe',
    })

    if (migrationRequired) {
      // prisma generate
      // use --create-only if this fails and then migrate deploy
      execSync(
        `cd ${tempDir}/${functionName} && npx prisma migrate dev --name init`,
        {
          cwd: tempDir,
          stdio: 'pipe',
          env: {
            ...process.env,
            DATABASE_URL: databaseUrl,
            SHADOW_DATABASE_URL: shadowDatabaseUrl,
            PRISMA_SCHEMA_ENGINE_BINARY:
              process.env.PRISMA_SCHEMA_ENGINE_BINARY || '',
            FORCE_COLOR: '0',
          },
        }
      )
      // execSync(
      //   `cd ${tempDir}/${functionName} && pnpm prisma migrate deploy`,
      //   {
      //     cwd: tempDir,
      //     stdio: 'pipe',
      //   }
      // )
    }

    // prisma generate
    execSync(`cd ${tempDir}/${functionName} && npx prisma generate`, {
      cwd: tempDir,
      stdio: 'pipe',
    })

    // npx tsc
    execSync(`cd ${tempDir}/${functionName} && npx tsc`, {
      cwd: tempDir,
      stdio: 'pipe',
    })

    // zip the function
    // Create zip file
    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    archive.pipe(output)

    // add all files in the function directory
    const allJsFiles = fs.readdirSync(path.join(tempDir, functionName))
    allJsFiles.forEach((file) => {
      const filePath = path.join(tempDir, functionName, file)
      const isDirectory = fs.statSync(filePath).isDirectory()
      if (isDirectory) {
        archive.directory(filePath, file)
      } else {
        archive.file(filePath, { name: file })
      }
    })

    await archive.finalize()

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        resolve()
      })
      archive.on('error', (error) => {
        reject(error)
      })
    })

    return { zipFilePath, tempDirPath: tempDir }
  } catch (error) {
    console.log('error', error)
    const stdErr = (error as any)?.stderr as Buffer
    console.log('stdErr', stdErr.toString())
    console.log('Error creating deployment package:', stdErr.toString())
    throw error
  }
}

export async function invokeFunction(
  functionName: string,
  agentWallet: AgentWallet,
  payload: Record<string, any>
) {
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

  console.log('result', result)

  // execute transaction if present
  if (result.transaction) {
    const { txnRequest, rpcUrl } = result.transaction
    // base sepolia override
    // const rpcUrl = 'https://base-sepolia-rpc.publicnode.com'
    if (!txnRequest || !rpcUrl) {
      throw createError(400, 'Invalid transaction request')
    }

    console.log('rpcUrl', rpcUrl)

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    console.log('provider', provider)
    const wallet = new ethers.Wallet(agentWallet.privateKey, provider)
    console.log('wallet', wallet.address)
    const txnData = {
      from: wallet.address,
      data: txnRequest.data,
    } as any
    if (txnRequest.to) {
      txnData.to = txnRequest.to
    }
    console.log('txnData', txnData)
    const txn = await wallet.sendTransaction(txnData)
    const txnReceipt = await txn.wait()

    result.txnReceipt = txnReceipt
    result.txn = txn
  }

  return result
}
