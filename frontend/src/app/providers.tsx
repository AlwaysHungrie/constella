'use client'

import PrivyProvider from '@/providers/privy'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <PrivyProvider>{children}</PrivyProvider>
}
