'use client'

import { AddFunction } from '@/components/addFunction'
import { Dialog, DialogContent } from '@/components/dialog'
import { Header } from '@/components/header'
import { RegisterWallet } from '@/components/registerWallet'
import StarBackground from '@/components/starBackground'
import { VerifyAttestation } from '@/components/verifyAttestation'
import { usePrivy } from '@privy-io/react-auth'
import { useCallback, useEffect, useState } from 'react'

export default function Home() {
  const [dialog, setDialog] = useState<DialogContent | null>(null)
  const [widget, setWidget] = useState<'register' | 'inspect' | 'addFunction'>(
    'register'
  )
  const [token, setToken] = useState<string | null>(null)

  const { user, getAccessToken } = usePrivy()
  const address = user?.wallet?.address

  const getNonce = useCallback(
    async (userAddress: string) => {
      try {
        const accessToken = await getAccessToken()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WALLET_HOST}/auth/token?address=${userAddress}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        const data = await response.json()
        console.log(data)
        setToken(data.token)
      } catch (error) {
        console.log(error)
      }
    },
    [setToken, getAccessToken]
  )

  useEffect(() => {
    if (!address) return
    getNonce(address)
  }, [address, getNonce])

  return (
    <div>
      <StarBackground isPaused={!!dialog} />
      <Dialog onClose={() => setDialog(null)} dialog={dialog} />
      <div className="min-h-dvh w-full flex flex-col justify-center items-center z-50 py-4 sm:py-6 font-mono overflow-x-hidden">
        <Header
          setWidget={setWidget}
          openDialog={(title, content) =>
            setDialog({ TITLE: title, CONTENT: content })
          }
        />
        {widget === 'register' && (
          <RegisterWallet setDialog={setDialog} token={token} />
        )}
        {widget === 'inspect' && <VerifyAttestation setDialog={setDialog} />}
        {widget === 'addFunction' && (
          <AddFunction setDialog={setDialog} token={token} />
        )}
      </div>
    </div>
  )
}
