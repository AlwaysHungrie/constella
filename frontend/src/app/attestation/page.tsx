'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { Loader, LucideAlertTriangle } from 'lucide-react'

type Attestation = {
  attestationHash: string
  agentAddress: string
  agentDomain: string
  agentSystemPrompt: string
  agentWalletAddress: string
  functionCalls: string[]
  transactionHashes: string[]
}

function AttestationPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const attestationHash = searchParams.get('hash')

  const [attestation, setAttestation] = useState<Attestation | null>(null)

  const [attestationData, setAttestationData] = useState<{
    server_name: string
    time: string
    verifying_key: string
    recv: string
    sent: string
  }>()

  const fetchAttestation = useCallback(async (attestationHash: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WALLET_HOST}/attestation/${attestationHash}`
      )
      const data = await response.json()
      console.log(data)
      setAttestation(data)

      const result = JSON.parse(data?.result)
      console.log(result)
      setAttestationData({
        ...result,
        sent: JSON.stringify(result.sent, null, 2),
        recv: JSON.stringify(result.recv, null, 2),
      })
    } catch (error) {
      console.log(error)
      setError('Could not verify attestation')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (attestationHash) {
      fetchAttestation(attestationHash)
    }
  }, [fetchAttestation, attestationHash])

  const renderIfJson = (json: string) => {
    try {
      const data = JSON.parse(json)
      return (
        <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return json
    }
  }

  const renderSent = (sent: string) => {
    return sent
      .split('\r\n')
      .map((line, index) => <span key={index}>{renderIfJson(line)}</span>)
  }

  const renderAttestationData = () => {
    if (error) return

    return (
      <div className="flex flex-col gap-2 break-words">
        <p className="font-bold text-2xl">Attestation Report: </p>
        <code className="text-sm">{attestationHash}</code>
        <p>==============================================</p>
        <p>
          Time: <span className="text-sm">{attestationData?.time}</span>
        </p>
        <p>
          Notary Key:{' '}
          <span className="text-sm">{attestationData?.verifying_key}</span>
        </p>
        <p>
          Server Name:{' '}
          <span className="text-sm">{attestationData?.server_name}</span>
        </p>
        <p>==============================================</p>
        <p>Sent Data:</p>
        <br />
        <div>{renderSent(attestationData?.sent ?? '')}</div>
        <p>==============================================</p>
        <p>Received Data:</p>
        <br />
        <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">
          {attestationData?.recv}
        </pre>
      </div>
    )
  }

  const parseIfJson = (json: string) => {
    try {
      return JSON.parse(json)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return null
    }
  }

  const renderFunctionCalls = (
    functionCalls: string[],
    transactionHashes: string[]
  ) => {
    return functionCalls.map((call, index) => {
      const functionCall = parseIfJson(call)
      if (!functionCall) return null
      const transactionHash = parseIfJson(transactionHashes[index])

      const name = functionCall?.function?.name
      const args = JSON.parse(functionCall?.function?.arguments)
      const argsString = Object.entries(args).map(([key, value]) => {
        return `${key}: ${value}`
      })

      return (
        <div key={index}>
          <p>
            {index + 1}. <span className="font-bold">{name}</span>
          </p>
          <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">
            {argsString.join('\n')}
          </pre>
          <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap mt-2">
            Transaction Hash: {transactionHash?.hash}
          </pre>
          <br />
        </div>
      )
    })
  }

  const renderAttestation = () => {
    if (error) return

    return (
      <div className="flex flex-col gap-2 break-words">
        <p className="font-bold text-2xl">Function Calls: </p>
        <div>
          {renderFunctionCalls(
            attestation?.functionCalls ?? [],
            attestation?.transactionHashes ?? []
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="px-3 py-1 bg-gray-200 rounded-md text-xs flex items-center">
          <Loader className="h-3 w-3 animate-spin mr-2" />
          Verifying...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="px-3 py-1 bg-gray-200 rounded-md text-xs flex items-center">
          <LucideAlertTriangle className="h-3 w-3 mr-2" />
          Could not verify attestation
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen font-mono">
      <div className="flex flex-col gap-2 break-words p-8">
        {renderAttestation()}
        {renderAttestationData()}
      </div>
    </div>
  )
}

export default function AttestationPageWrapper() {
  return (
    <Suspense>
      <AttestationPage />
    </Suspense>
  )
}