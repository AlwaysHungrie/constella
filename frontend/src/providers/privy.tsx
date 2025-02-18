'use client';

import { type ReactNode } from 'react';
import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';

import { scroll } from 'viem/chains'

const SCROLL = {
  ...scroll,
  rpcUrls: {
    ...scroll.rpcUrls,
    privyWalletOverride: {
      http: ['https://sepolia-rpc.scroll.io'],
    },
  },
}

interface PrivyProviderProps {
  children: ReactNode;
}

export default function PrivyProvider({ children }: PrivyProviderProps) {
  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_API_ID!}
      config={{
        // Customize Privy's appearance in your app
        appearance: {
          theme: 'light',
          accentColor: '#FA3B6A',
          logo: '/one.svg',
        },
        supportedChains: [SCROLL],
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}