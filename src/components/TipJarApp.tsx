import { useState } from 'react'
import { useAccount, useSwitchChain, useWriteContract, useReadContract } from 'wagmi'
import { ConnectKitButton } from 'connectkit'

import { TokenUSDC } from '@web3icons/react'
import { Coffee, Users, Wallet } from 'lucide-react'
import { TIPJAR_CHAIN_ID, TIPJAR_ADDRESS, TIPJAR_ABI } from '../contract'
import { GoalCard } from './GoalCard'
import { TipForm } from './TipForm'
import { RecentTips } from './RecentTips'
import { RecipientCard } from './RecipientCard'

const RECIPIENT_A = '0x7B8f0B8E09ca522Ad3418fb89B9176f1bc74644c'.toLowerCase()

const glass = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.4)',
} as React.CSSProperties

export function TipJarApp() {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const [tipSuccess, setTipSuccess] = useState(false)
  const isWrongChain = isConnected && chainId !== TIPJAR_CHAIN_ID

  const isOwner = isConnected && address?.toLowerCase() === RECIPIENT_A

  const { writeContract, isPending } = useWriteContract()

  const { data: pendingA } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: 'pendingBalance',
    args: [RECIPIENT_A],
    query: { enabled: isOwner },
  })

  const handleWithdraw = () => {
    writeContract({
      address: TIPJAR_ADDRESS,
      abi: TIPJAR_ABI,
      functionName: 'withdrawA',
    })
  }

  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1a1a1a 0%, #2d2a26 35%, #f5f0eb 100%)',
      }}
    >
      {/* Ambient coffee-themed shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Left side abstract shape */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '-8%',
            width: 420,
            height: 420,
            borderRadius: '60% 40% 50% 50%',
            background: 'radial-gradient(circle, rgba(90,70,55,0.35) 0%, transparent 70%)',
            filter: 'blur(40px)',
            transform: 'rotate(-15deg)',
          }}
        />
        {/* Right side abstract shape */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '-10%',
            width: 380,
            height: 380,
            borderRadius: '50% 60% 40% 50%',
            background: 'radial-gradient(circle, rgba(70,55,45,0.3) 0%, transparent 65%)',
            filter: 'blur(50px)',
            transform: 'rotate(20deg)',
          }}
        />
        {/* Subtle steam-like shape top right */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            right: '12%',
            width: 180,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
      </div>

      {/* Page */}
      <div className="relative z-10 mx-auto max-w-md px-4 pb-16 pt-6">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee size={20} style={{ color: '#f5f0eb' }} />
            <span className="display text-lg font-bold" style={{ color: '#f5f0eb' }}>
              TipJar
            </span>
          </div>
          <ConnectKitButton.Custom>
            {({ isConnected: ck_connected, show, address: ck_address }) => (
              <button
                onClick={show}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: '#3d3833', color: 'white' }}
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
            style={{ background: 'rgba(186,43,76,0.15)', border: '1px solid rgba(186,43,76,0.3)' }}
          >
            <span className="text-sm font-medium" style={{ color: '#ff6b6b' }}>
              Switch to Arc Testnet to tip
            </span>
            <button
              onClick={() => switchChain({ chainId: TIPJAR_CHAIN_ID })}
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: '#ba2b4c', color: 'white' }}
            >
              Switch
            </button>
          </div>
        )}

        {/* Hero */}
        <div className="mb-5 rounded-3xl p-6 text-center" style={glass}>
          <img 
            src="/coffee-cup.png" 
            alt="Coffee" 
            className="mx-auto mb-4 h-40 w-40 object-contain drop-shadow-lg"
          />
          <div className="mb-1 flex items-center justify-center gap-2">
            <TokenUSDC variant="branded" size={20} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6560' }}>
              Powered by USDC on Arc
            </span>
          </div>
          <h1 className="display mt-2 text-3xl font-bold leading-tight" style={{ color: '#1a1a1a', letterSpacing: '-0.03em' }}>
            Support our work
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#4a4540' }}>
            Every tip goes directly on-chain and is split automatically.
          </p>
        </div>

        {/* Owner Withdraw Section */}
        {isOwner && (
          <div className="mb-5 rounded-2xl p-5" style={glass}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={18} style={{ color: '#1a1a1a' }} />
                <span className="font-semibold" style={{ color: '#1a1a1a' }}>Your Balance</span>
              </div>
              <span className="text-lg font-bold" style={{ color: '#1a1a1a' }}>
                {pendingA ? (Number(pendingA) / 1e6).toFixed(2) : '0.00'} USDC
              </span>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={isPending || !pendingA || Number(pendingA) === 0}
              className="mt-4 w-full rounded-full py-3 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: '#3d3833', color: 'white' }}
            >
              {isPending ? 'Withdrawing...' : 'Withdraw'}
            </button>
          </div>
        )}

        {/* Goal & totals */}
        <GoalCard onTipSuccess={tipSuccess} />

        <div className="mt-4 space-y-3">
          {/* Recipients */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Users size={14} style={{ color: '#6b6560' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6560' }}>
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
          <p className="mt-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Need test USDC? Use the <strong>Get test USDC</strong> button in the Arc Studio sidebar.
          </p>
        )}
      </div>
    </div>
  )
}