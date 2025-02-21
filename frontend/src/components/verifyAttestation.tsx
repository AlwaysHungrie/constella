'use client'

import { useCallback, useState } from 'react'
import { HiExternalLink, HiInformationCircle, HiStar } from 'react-icons/hi'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import Link from 'next/link'
import CTAButton from './cta'
import { DialogContent } from './dialog'

export const VerifyAttestation = ({
  setDialog,
}: {
  setDialog: (dialog: DialogContent) => void
}) => {
  const [attestation, setAttestation] = useState<string>('')
  const [address, setAddress] = useState<string>('')

  const verifyAttestation = useCallback(
    async (address: string, attestation: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WALLET_HOST}/verify`,
          {
            method: 'POST',
            body: JSON.stringify({ address, attestation }),
          }
        )

        const data = await response.json()
        const output = data.output
        if (data.error || !output) {
          setDialog({
            TITLE: 'verification-failed',
            CONTENT: 'Failed to read attestation file returned by agent.',
          })

          return
        }

        setDialog({
          TITLE: attestation,
          CONTENT: `Time: ${output.time}
          ==============================================
          Server Name: ${output.server_name}
          ==============================================
          Sent: ${output.sent}
          ==============================================
          Received: ${output.recv}
          `,
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
    [setDialog]
  )

  return (
    <div className="relative text-[#05D505] my-4 flex-1 flex flex-col justify-center aspect-[16/9] w-[400px] max-w-[90vw] mx-auto px-2 sm:px-4">
      <div
        className="relative border border-[#004400] bg-[#e2ebe215] rounded-lg p-4 backdrop-blur-[2px] flex flex-col h-full overflow-y-auto"
        style={{
          maxHeight: 'min(70vh, 600px)',
        }}
      >
        <div className="text-2xl font-bold text-center">
          Inspect Attestations
        </div>
        <div className="opacity-80 text-sm py-6">
          <div className="flex items-center gap-2 mb-px w-full">
            <div className="flex-1">Agent&apos;s wallet address</div>
            <Popover>
              <PopoverTrigger>
                <HiInformationCircle className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="absolute bg-white rounded-sm shadow-sm p-1 max-w-xs text-sm text-black whitespace-normal">
                <p className="">
                  In order to test with a dummy attestation, use the following
                  address and key.
                  <br />
                  <br />
                  <span className="italic text-xs">Wallet address:</span>&nbsp;
                  <span className="bg-red-50 p-1 rounded-sm break-all">
                    {process.env.NEXT_PUBLIC_TEST_WALLET_ADDRESS}
                  </span>
                  <br />
                  <span className="italic text-xs">File key:</span>&nbsp;
                  <span className="bg-red-50 p-1 rounded-sm">test</span>
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <input
            type="text"
            placeholder="Agent's wallet address"
            className="w-full p-2 rounded-md bg-[#004400] text-[#05D505] border border-[#05D505]"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <br />
          <br />
          <div className="flex items-center gap-2 mb-px w-full">
            <div className="flex-1">Attestation</div>
            <Popover>
              <PopoverTrigger>
                <HiInformationCircle className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="absolute bg-white rounded-sm shadow-sm p-1 max-w-xs text-sm text-black whitespace-normal">
                <p className="">
                  {`Constella will be calling your agent's endpoint at
                  <domain>/presigned-url?key=<attestation-key>. The agent needs to return a
                  json object with the field downloadUrl that is a presigned
                  url to download the attestation object.`}
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <input
            type="text"
            placeholder="Attestation key"
            className="w-full p-2 rounded-md bg-[#004400] text-[#05D505] border border-[#05D505]"
            value={attestation}
            onChange={(e) => setAttestation(e.target.value)}
          />
          <span className="italic mt-2">
            <>
              Do not share attestations with sensitive data with untrusted
              parties.
            </>
          </span>
          <br />
          <br />
          <span className="italic">
            <>
              &lt;This is a general tool to inspect any suported tls
              attestations, and does not make any wallet interactions&gt;
            </>
          </span>
        </div>

        <CTAButton
          disabled={!address || !attestation}
          onClick={() => {
            if (!address || !attestation) {
              return
            }
            verifyAttestation(address, attestation)
          }}
        >
          Verify Attestation
        </CTAButton>
      </div>

      <div className="absolute bottom-[-24px] right-0">
        <div className="flex flex-col text-xs font-bold w-full">
          <Link
            href="https://nitro-verifier.pineappl.xyz"
            target="_blank"
            className="flex items-center gap-1"
          >
            <HiStar className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
            Verify Constella
          </Link>
        </div>
      </div>

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
