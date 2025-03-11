import { usePrivy } from '@privy-io/react-auth'
import Link from 'next/link'
import { HiExternalLink, HiStar } from 'react-icons/hi'

export const Footer = () => {
  const { logout, user, login } = usePrivy()
  return (
    <>
      {user?.wallet?.address ? (
        <div className="absolute bottom-[-24px] right-0">
          <div className="flex flex-col text-xs font-bold w-full">
            <div className="cursor-pointer" onClick={logout}>
              ⦿ Disconnect Wallet
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-[-24px] right-0">
          <div className="flex flex-col text-xs font-bold w-full">
            <div className="cursor-pointer" onClick={login}>
              ⦿ Connect Wallet
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-[-24px] left-0">
        <div className="flex flex-col text-xs font-bold w-full">
          <Link
            href="https://playground-frontend.constella.one"
            target="_blank"
            className="flex items-center gap-1"
          >
            <HiExternalLink className="w-4 h-4 text-[#05D505] hover:opacity-80 transition-opacity" />
            Playground
          </Link>
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
    </>
  )
}
