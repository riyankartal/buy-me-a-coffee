import { useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'

import { TokenUSDC } from '@web3icons/react'
import { Coffee, Users } from 'lucide-react'
import { TIPJAR_CHAIN_ID } from '../contract'
import { GoalCard } from './GoalCard'
import { TipForm } from './TipForm'
import { RecentTips } from './RecentTips'
import { RecipientCard } from './RecipientCard'

const glass = {
  background: 'rgba(255,255,255,0.64)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.68)',
  boxShadow: '0 8px 32px rgba(18,45,69,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
} as React.CSSProperties

export function TipJarApp() {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const [tipSuccess, setTipSuccess] = useState(false)
  const isWrongChain = isConnected && chainId !== TIPJAR_CHAIN_ID

  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f9f9fc 0%, #fffcf7 52%, #fbf7f2 100%)' }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: 'absolute', top: '6%', left: '4%', width: 320, height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(133,177,237,0.18) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '10%', right: '6%', width: 280, height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,205,131,0.18) 0%, transparent 70%)',
            filter: 'blur(58px)',
          }}
        />
      </div>

      {/* Page */}
      <div className="relative z-10 mx-auto max-w-md px-4 pb-16 pt-6">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee size={20} style={{ color: 'var(--ink)' }} />
            <span className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>
              TipJar
            </span>
          </div>
          <ConnectKitButton.Custom>
            {({ isConnected: ck_connected, show, address: ck_address }) => (
              <button
                onClick={show}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {ck_connected
                  ? `${ck_address?.slice(0, 6)}…${ck_address?.slice(-4)}`
                  : 'Connect Wallet'}
              </button>
            )}
          </ConnectKitButton.Custom>
        </header>

        {/* Wrong chain banner */}
        {isWrongChain && (
          <div
            className="mb-4 rounded-2xl p-4 flex items-center justify-between gap-3"
            style={{ background: 'rgba(186,43,76,0.08)', border: '1px solid rgba(186,43,76,0.25)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
              Switch to Arc Testnet to tip
            </span>
            <button
              onClick={() => switchChain({ chainId: TIPJAR_CHAIN_ID })}
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'var(--danger)', color: 'white' }}
            >
              Switch
            </button>
          </div>
        )}

        {/* Hero */}
        <div className="mb-5 rounded-3xl p-6" style={glass}>
          <div className="mb-1 flex items-center gap-2">
            <TokenUSDC variant="branded" size={20} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Powered by USDC on Arc
            </span>
          </div>
          <h1 className="display mt-2 text-3xl font-bold leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
            Support our work
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
            Every tip goes directly on-chain and is split automatically.
          </p>
        </div>

        {/* Goal & totals */}
        <GoalCard onTipSuccess={tipSuccess} />

        <div className="mt-4 space-y-3">
          {/* Recipients */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.46)',
              border: '1px solid rgba(255,255,255,0.56)',
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Users size={14} style={{ color: 'var(--muted)' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Split
              </span>
            </div>
            <div className="flex gap-2">
              <RecipientCard role="A" />
              <RecipientCard role="B" />
            </div>
          </div>

          {/* Tip form */}
          <TipForm
            walletAddress={address}
            isConnected={isConnected}
            isWrongChain={isWrongChain}
            onSuccess={() => setTipSuccess(t => !t)}
          />

          {/* Recent tips */}
          <RecentTips refreshTrigger={tipSuccess} />
        </div>

        {/* Faucet hint */}
        {isConnected && (
          <p className="mt-6 text-center text-xs" style={{ color: 'var(--subtle)' }}>
            Need test USDC? Use the <strong>Get test USDC</strong> button in the Arc Studio sidebar.
          </p>
        )}
      </div>
    </div>
  )
}
