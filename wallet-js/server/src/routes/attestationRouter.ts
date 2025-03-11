import express, { Request, Response } from 'express'
import axios from 'axios'
import { asyncHandler } from '../middleware/misc'
import { handleValidationErrors } from '../middleware/validation'
import { body } from 'express-validator'
import createError from 'http-errors'
import prisma from '../prisma'
import config from '../config'
import { execSync } from 'child_process'
import { generateAttestationHash } from '../utils/random'
import { invokeFunction } from '../services/functionService'

const RUST_BINARY_PATH = config.RUST_BINARY_PATH
const router = express.Router() 

const buildRustCommand = (fileKey: string, agentHost: string) => {
  return `${RUST_BINARY_PATH} --file-key ${fileKey} --agent-host ${agentHost}`
}

const parseIfJson = (str: string) => {
  try {
    return JSON.parse(str)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return null
  }
}

const getJsonFromAttestation = (attestation: string) => {
  const recv = attestation.substring(
    attestation.indexOf('{'),
    attestation.lastIndexOf('}') + 1
  )
  const recvJson = recv
    .split('\r\n')
    .filter((_, i) => {
      return i % 2 === 0
    })
    .join('')
  const jsonResponse = parseIfJson(recvJson)

  if (!jsonResponse) {
    return null
  }

  return jsonResponse
}

const executeRustCommand = async (command: string) => {
  try {
    console.log('executing rust command', command)
    const resultBuffer = execSync(command)
    const result = resultBuffer.toString()
    console.log('rust command result', result)
    const resultJson = JSON.parse(result)

    const sent = getJsonFromAttestation(resultJson.sent)
    const recv = getJsonFromAttestation(resultJson.recv)

    resultJson.sent = sent
    resultJson.recv = recv

    return resultJson
  } catch (error) {
    throw createError(500, 'Error reading attestation from file')
  }
}

router.post(
  '/execute',
  body('address').isString(),
  body('attestationKey').isString(),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { address, attestationKey } = req.body
    const agentWallet = await prisma.agentWallet.findUnique({
      where: {
        walletAddress: address,
      },
    })

    if (!agentWallet) {
      throw createError(404, 'Agent wallet not found')
    }

    const command = buildRustCommand(attestationKey, agentWallet.domain)
    const result = await executeRustCommand(command)

    const attestationHash = generateAttestationHash(JSON.stringify(result))

    // check system prompt
    const sentMessages = result.sent.messages
    const attestationSystemPrompt = sentMessages?.length > 0 ? sentMessages[0].content : ''

    const isSystemPromptValid = agentWallet.systemPrompt && agentWallet.systemPrompt === attestationSystemPrompt

    console.log('isSystemPromptValid', isSystemPromptValid)

    const choices = result.recv.choices
    const toolCalls = choices[0]?.message?.tool_calls
    const functionResults = []
    if (toolCalls) {
      for (const toolCall of toolCalls) {
        const functionName = toolCall?.function?.name
        const functionArgs = JSON.parse(toolCall?.function?.arguments)
        
        console.log('executing function', functionName, functionArgs)

        try {
          const functionResult = await invokeFunction(functionName, agentWallet, functionArgs)
          functionResults.push(functionResult)
        } catch (e) {
          console.error('Error invoking function', e)
        }
      }
    }

    res.json({ result, functionResults })
  })
)

export default router
