'use client'

import { Dialog, DialogContent } from '@/components/dialog'
import { Header } from '@/components/header'
import { RegisterWallet } from '@/components/registerWallet'
import StarBackground from '@/components/starBackground'
import { VerifyAttestation } from '@/components/verifyAttestation'
// import StarBackground from '@/components/starBackground'
// import { StarChart } from '@/components/starChart'
import { useState } from 'react'

export default function Home() {
  const [dialog, setDialog] = useState<DialogContent | null>(null)
  const [widget, setWidget] = useState<'register' | 'inspect'>('register')

  return (
    <div>
      <StarBackground isPaused={!!dialog} />
      <Dialog onClose={() => setDialog(null)} dialog={dialog} />
      <div className="min-h-dvh w-full flex flex-col items-center z-50 py-4 sm:py-6 font-mono overflow-x-hidden">
        <Header
          setWidget={setWidget}
          openDialog={(title, content) =>
            setDialog({ TITLE: title, CONTENT: content })
          }
        />
        {widget === 'register' && <RegisterWallet setDialog={setDialog} />}
        {widget === 'inspect' && <VerifyAttestation setDialog={setDialog} />}
      </div>
    </div>
  )
}
