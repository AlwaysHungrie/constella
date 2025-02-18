'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useCallback, useEffect, useState } from 'react'
import { HiExternalLink, HiInformationCircle } from 'react-icons/hi'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import Link from 'next/link'
import CTAButton from './cta'
import { DialogContent } from './dialog'

export const RegisterWallet = ({
  setDialog,
}: {
  setDialog: (dialog: DialogContent) => void
}) => {
  const { logout, user, login, authenticated } = usePrivy()

  const [domain, setDomain] = useState<string>('')
  const [systemPrompt, setSystemPrompt] = useState<string>('')

  const address = user?.wallet?.address

  const getNonce = useCallback(async (userAddress: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_WALLET_HOST}/register/get-nonce`, {
        method: 'POST',
        body: JSON.stringify({ userAddress }),
      })
    } catch (error) {
      console.log(error)
    }
  }, [])

  const registerWallet = useCallback(
    async (address: string, domain: string, systemPrompt: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WALLET_HOST}/register/wallet`,
          {
            method: 'POST',
            body: JSON.stringify({ address, domain, systemPrompt }),
          }
        )

        const data = await response.json()
        console.log(data)
        if (data.error === 'Wallet already exists') {
          setDialog({
            TITLE: 'agent-found',
            CONTENT: `An agent with this domain and system prompt already exists. It's wallet address is ${data.address}. Use a different domain or system prompt to register a new agent.`,
          })

          return
        }

        setDialog({
          TITLE: 'agent-created',
          CONTENT: `A wallet has been created for your agent. It's wallet address is ${data.address}. You can now use the registered domain to send attestations and use this wallet.`,
        })
      } catch (error) {
        console.log(error)
        if (
          error instanceof Error &&
          error.message === 'Wallet already exists'
        ) {
          console.log('Wallet already exists')
        }
      }
    },
    []
  )

  useEffect(() => {
    if (!address) return
    getNonce(address)
  }, [address, getNonce])

  return (
    <div className="relative text-[#05D505] my-4 flex-1 flex flex-col justify-center aspect-[16/9] w-[400px] max-w-[90vw] mx-auto px-2 sm:px-4">
      <div
        className="relative border border-[#004400] bg-[#e2ebe215] rounded-lg p-4 backdrop-blur-[2px] flex flex-col h-full overflow-y-auto"
        style={{
          maxHeight: 'min(70vh, 600px)',
        }}
      >
        {/* <div className="text-2xl font-bold sm:my-2 w-full text-center">
          Agentic Wallet v0.0.1
        </div> */}

        <div className="text-2xl font-bold text-center">
          Autonomous Wallet v0.0.1
          <br />
        </div>

        {!address && (
          <div className="opacity-80 text-sm my-auto py-6">
            Welcome to Constella,
            <br />
            <br />
            Constella is a verifiably autonomous wallet for AI agents. A wallet
            once registered can only be controlled by decisions made by an agent
            and is not accessible to the agent&apos;s owners or Constella.
            <br />
            <br />
            To learn more, select from the menu above:
            <br />
            <br />
            <ul>
              {[
                {
                  title: 'Agents',
                  description: 'to know how can agents use this wallet',
                },
                {
                  title: 'Verify',
                  description: "to know how to verify constella's autonomy",
                },
                {
                  title: 'About',
                  description: 'to learn more about the project',
                },
              ].map((item, index) => (
                <li key={index} className="list-disc list-inside mb-2">
                  <span className="font-bold">{item.title}</span>:{' '}
                  {item.description}
                </li>
              ))}
            </ul>
            <br />
            <span className="italic">
              <>&lt;connect your wallet to get started&gt;</>
            </span>
          </div>
        )}

        {address && (
          <div className="opacity-80 text-sm py-6">
            Enter agent&apos;s info to create a wallet:
            <br />
            <br />
            <div className="flex items-center gap-2 mb-px w-full">
              <div className="flex-1">Hosted domain</div>
              <Popover>
                <PopoverTrigger>
                  <HiInformationCircle className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
                </PopoverTrigger>
                <PopoverContent className="absolute bg-white rounded-sm shadow-sm p-1 max-w-xs text-sm text-black whitespace-normal">
                  <p className="">
                    Enter the domain where your agent is hosted. Attestations
                    received only from this domain will be accepted.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <input
              type="text"
              placeholder="https://duin.fun"
              className="w-full p-2 rounded-md bg-[#004400] text-[#05D505] border border-[#05D505]"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <br />
            <br />
            <div className="flex items-center gap-2 mb-px w-full">
              <div className="flex-1">System prompt</div>
              <Popover>
                <PopoverTrigger>
                  <HiInformationCircle className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
                </PopoverTrigger>
                <PopoverContent className="absolute bg-white rounded-sm shadow-sm p-1 max-w-xs text-sm text-black whitespace-normal">
                  <p className="">
                    Your attestation needs to verify a request was made to
                    trusted llm provider using this exact system prompt. Use
                    &apos;X&apos;s to indicate variables that will be replaced
                    with the actual values.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <textarea
              placeholder="Today is XXXXXXXXXXXXXXXXXXXXXXXX. You are a helpful assistant."
              rows={4}
              className="w-full p-2 rounded-md bg-[#004400] text-[#05D505] border border-[#05D505]"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <br />
            <br />
            <br />
            <span className="italic">
              <>
                &lt;Once registered, the same domain and system prompt cannot be
                used for another wallet&gt;
              </>
            </span>
          </div>
        )}

        {authenticated && address ? (
          <CTAButton
            disabled={!domain || !systemPrompt}
            onClick={() => {
              if (!domain || !systemPrompt) {
                return
              }
              registerWallet(address, domain, systemPrompt)
            }}
          >
            Register Wallet
          </CTAButton>
        ) : (
          <CTAButton
            onClick={() => {
              login()
            }}
          >
            Connect Wallet
          </CTAButton>
        )}
      </div>
      {user?.wallet?.address && (
        <div className="absolute bottom-[-24px] right-0">
          <div className="flex flex-col text-xs font-bold w-full">
            <div className="cursor-pointer" onClick={logout}>
              ⦿ Disconnect Wallet
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-[-24px] left-0">
        <div className="flex flex-col text-xs font-bold w-full">
          <Link
            href="https://playground.constella.one"
            target="_blank"
            className="flex items-center gap-1"
          >
            <HiExternalLink className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
            Playground
          </Link>
        </div>
      </div>
    </div>
  )
}
