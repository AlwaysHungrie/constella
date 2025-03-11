'use client'

import { useCallback, useState } from 'react'
import { HiInformationCircle } from 'react-icons/hi'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import CTAButton from './cta'
import { DialogContent } from './dialog'
import { Footer } from './footer'

export const AddFunction = ({
  setDialog,
  token,
}: {
  setDialog: (dialog: DialogContent) => void
  token: string | null
}) => {
  const [githubUrl, setGithubUrl] = useState<string>('')
  const [functionName, setFunctionName] = useState<string>('')
  const [envVars, setEnvVars] = useState<string>('')
  const [address, setAddress] = useState<string>('')

  const addFunction = useCallback(
    async (address: string, githubUrl: string, functionName: string, envVars: string) => {
      try {
        if (!token) return

        const envVarsObject = envVars.split('\n').reduce((acc: Record<string, string>, line) => {
          const [key, value] = line.split('=')
          acc[key] = value
          return acc
        }, {})

        const body = { githubUrl, functionName, envVariables: envVarsObject }
        console.log(body)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WALLET_HOST}/agent-wallet/${address}/function`,
          {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        const data = await response.json()
        console.log(data)
        setDialog({
          TITLE: 'function-created',
          CONTENT: JSON.stringify(data),
        })
      } catch (error) {
        console.log(error)
      }
    },
    [token, setDialog]
  )

  return (
    <div className="relative text-[#05D505] my-4 flex-1 flex flex-col justify-center aspect-[16/9] w-[400px] max-w-[90vw] mx-auto px-2 sm:px-4">
      <div
        className="relative border border-[#004400] bg-[#e2ebe215] rounded-lg p-4 backdrop-blur-[2px] flex flex-col h-full overflow-y-auto"
        style={{
          maxHeight: 'min(70vh, 600px)',
        }}
      >
        <div className="text-2xl font-bold text-center">Add Function</div>
        <div className="opacity-80 text-sm py-6">
          <div className="flex items-center gap-2 mb-px w-full">
            <div className="flex-1">Agent&apos;s wallet address</div>
            <Popover>
              <PopoverTrigger>
                <HiInformationCircle className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="absolute bg-white rounded-sm shadow-sm p-1 max-w-xs text-sm text-black whitespace-normal">
                <p className="">
                  This agent needs to have been created using the curretly
                  connected wallet.
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
            <div className="flex-1">Github URL</div>
            <Popover>
              <PopoverTrigger>
                <HiInformationCircle className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="absolute bg-white rounded-sm shadow-sm p-1 max-w-xs text-sm text-black whitespace-normal">
                <p className="">
                  Follow the same structure as this example:
                  https://github.com/AlwaysHungrie/chunkysoup
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <input
            type="text"
            placeholder="Github URL"
            className="w-full p-2 rounded-md bg-[#004400] text-[#05D505] border border-[#05D505]"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <br />
          <br />
          <div className="flex items-center gap-2 mb-px w-full">
            <div className="flex-1">Function Name</div>
            <Popover>
              <PopoverTrigger>
                <HiInformationCircle className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="absolute bg-white rounded-sm shadow-sm p-1 max-w-xs text-sm text-black whitespace-normal">
                <p className="">
                  Eg. addingredients, if you are using this example as the
                  github url: https://github.com/AlwaysHungrie/chunkysoup
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <input
            type="text"
            placeholder="Function Name"
            className="w-full p-2 rounded-md bg-[#004400] text-[#05D505] border border-[#05D505]"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
          />
          <br />
          <br />
          <div className="flex items-center gap-2 mb-px w-full">
            <div className="flex-1">Environment Variables</div>
            <Popover>
              <PopoverTrigger>
                <HiInformationCircle className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="absolute bg-white rounded-sm shadow-sm p-1 max-w-xs text-sm text-black whitespace-normal">
                <p className="">
                  An env file will be created at the root level of your function
                  code while compiling. There will be a DATABASE_URL and
                  SHADOW_DATABASE_URL variable to access your agent&apos;s
                  personal database.
                  <br />
                  <br />
                  DATABASE_URL=
                  <br />
                  SHADOW_DATABASE_URL=
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <textarea
            placeholder="Paste your .env file here"
            rows={4}
            className="w-full p-2 rounded-md bg-[#004400] text-[#05D505] border border-[#05D505]"
            value={envVars}
            onChange={(e) => setEnvVars(e.target.value)}
          />
          <br />
          <br />
          <span className="italic">
            <>
              &lt;You are responsible for making sure the function names are
              unique across your agent. Adding function code with same function
              name will result in an overwrite&gt;
            </>
          </span>
        </div>

        <CTAButton
          disabled={!address || !githubUrl}
          onClick={() => {
            if (!address || !githubUrl) {
              return
            }
            addFunction(address, githubUrl, functionName, envVars)
          }}
        >
          Add Function
        </CTAButton>
      </div>

      <Footer />
    </div>
  )
}
