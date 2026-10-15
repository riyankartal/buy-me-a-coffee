import { useState, useEffect, useRef } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { toast } from 'sonner'
import { Send, ChevronDown } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { ConnectKitButton } from 'connectkit'
import { TIPJAR_ADDRESS, TIPJAR_ABI, TIPJAR_CHAIN_ID } from '../contract'
import { getUsdc, buildTxExplorerUrl } from '../onchain-facts'
import { parseAmount, Amount, usdcDecimalsFor } from '../onchain-money'

interface TipFormProps {
  walletAddress: string | undefined
  isConnected: boolean
  isWrongChain: boolean
  onSuccess: () => void
}

const PRESET_AMOUNTS = [
  { label: 'Small', usdc: 5 },
  { label: 'Medium', usdc: 10 },
  { label: 'Large', usdc: 25 },
]

type Step = 'idle' | 'approving' | 'tipping' | 'done'

const glassInner = {
  background: 'rgba(255,255,255,0.46)',
  border: '1px solid rgba(255,255,255,0.56)',
} as React.CSSProperties

const spectral = 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)'

export function TipForm({ walletAddress, isConnected, isWrongChain, onSuccess }: TipFormProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(5)
  const [customAmount, setCustomAmount] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [tipperName, setTipperName] = useState('')
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>()
  const [tipTxHash, setTipTxHash] = useState<`0x${string}` | undefined>()

  // Keep a stable ref to parsedAmount so effects can read it without re-registering
  const parsedAmountRef = useRef<ReturnType<typeof parseAmount> | null>(null)
  const tipperNameRef = useRef('')
  const messageRef = useRef('')
  tipperNameRef.current = tipperName
  messageRef.current = message

  const usdcFact = getUsdc(TIPJAR_CHAIN_ID)
  const usdcAddress = usdcFact?.address as `0x${string}` | undefined
  const decimals = usdcDecimalsFor(TIPJAR_CHAIN_ID)

  // User USDC balance
  const { data: usdcBalance } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [walletAddress as `0x${string}`],
    chainId: TIPJAR_CHAIN_ID,
    query: { enabled: !!walletAddress && !!usdcAddress },
  })

  const { writeContract: approve, isPending: isApprovePending } = useWriteContract()
  const { writeContract: tipWrite, isPending: isTipPending } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    chainId: TIPJAR_CHAIN_ID,
  })

  const { isLoading: isTipConfirming, isSuccess: isTipSuccess } = useWaitForTransactionReceipt({
    hash: tipTxHash,
    chainId: TIPJAR_CHAIN_ID,
  })

  const rawAmount = isCustom
    ? customAmount.trim()
    : selectedPreset != null
    ? String(selectedPreset)
    : ''

  const parsedAmount = (() => {
    try {
      const n = parseFloat(rawAmount)
      if (!isNaN(n) && n > 0) return parseAmount(TIPJAR_CHAIN_ID, rawAmount)
      return null
    } catch {
      return null
    }
  })()
  parsedAmountRef.current = parsedAmount

  const balanceFmt = usdcBalance != null
    ? Number(Amount.fromRaw(usdcBalance, decimals).toFixed(2)).toLocaleString()
    : null

  // When approval confirms → send tip
  useEffect(() => {
    if (!isApproveSuccess || !approveTxHash || step !== 'approving') return
    const amount = parsedAmountRef.current
    if (!amount) return

    setStep('tipping')
    setApproveTxHash(undefined)

    tipWrite(
      {
        address: TIPJAR_ADDRESS,
        abi: TIPJAR_ABI,
        functionName: 'tip',
        args: [amount.raw, tipperNameRef.current.slice(0, 64), messageRef.current.slice(0, 256)],
        chainId: TIPJAR_CHAIN_ID,
      },
      {
        onSuccess(hash) {
          setTipTxHash(hash)
        },
        onError(err) {
          const msg = err?.message ?? ''
          if (msg.toLowerCase().includes('user rejected')) {
            toast.info('Cancelled.')
          } else {
            toast.error('Tip failed. Please try again.')
          }
          setStep('idle')
        },
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveSuccess])

  // When tip confirms → celebrate + reset
  useEffect(() => {
    if (!isTipSuccess || !tipTxHash || step !== 'tipping') return

    setStep('done')
    const explorerUrl = buildTxExplorerUrl(TIPJAR_CHAIN_ID, tipTxHash)
    toast.success('Tip sent!', {
      action: {
        label: 'View',
        onClick: () => window.open(explorerUrl, '_blank'),
      },
    })
    onSuccess()

    const t = setTimeout(() => {
      setStep('idle')
      setTipTxHash(undefined)
      setTipperName('')
      setMessage('')
      setCustomAmount('')
      setIsCustom(false)
      setSelectedPreset(5)
    }, 2000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTipSuccess])

  // Step 1: Approve
  const handleApprove = () => {
    if (!parsedAmount || !usdcAddress || !walletAddress) return
    setStep('approving')
    approve(
      {
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [TIPJAR_ADDRESS, parsedAmount.raw],
        chainId: TIPJAR_CHAIN_ID,
      },
      {
        onSuccess(hash) {
          setApproveTxHash(hash)
        },
        onError(err) {
          const msg = err?.message ?? ''
          if (msg.toLowerCase().includes('user rejected')) {
            toast.info('Cancelled.')
          } else {
            toast.error('Approval failed. Please try again.')
          }
          setStep('idle')
        },
      }
    )
  }

  const isLoading = isApprovePending || isApproveConfirming || isTipPending || isTipConfirming
  const isDone = step === 'done'

  const buttonLabel = () => {
    if (isDone) return 'Sent!'
    if (isApprovePending) return 'Confirm approval…'
    if (isApproveConfirming) return 'Approving…'
    if (isTipPending) return 'Confirm tip…'
    if (isTipConfirming) return 'Confirming…'
    return 'Send Tip'
  }

  const canTip = isConnected && !isWrongChain && !!parsedAmount && !isLoading && !isDone

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.64)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.68)',
        boxShadow: '0 8px 32px rgba(18,45,69,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
      }}
    >
      {/* Spectral accent strip */}
      <div className="h-1 w-full" style={{ background: spectral }} />

      <div className="p-5 space-y-4">
        {/* Amount presets */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Amount
          </p>
          <div className="flex gap-2">
            {PRESET_AMOUNTS.map(({ label, usdc }) => (
              <button
                key={usdc}
                onClick={() => { setSelectedPreset(usdc); setIsCustom(false) }}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={
                  !isCustom && selectedPreset === usdc
                    ? { background: 'var(--accent)', color: 'white', border: '1px solid var(--accent)' }
                    : { background: 'rgba(18,45,69,0.05)', color: 'var(--ink)', border: '1px solid rgba(18,45,69,0.1)' }
                }
              >
                {label}
                <span className="block text-[11px] font-normal opacity-75">${usdc}</span>
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
              style={
                isCustom
                  ? { background: 'var(--accent)', color: 'white', border: '1px solid var(--accent)' }
                  : { background: 'rgba(18,45,69,0.05)', color: 'var(--ink)', border: '1px solid rgba(18,45,69,0.1)' }
              }
            >
              Custom
              <ChevronDown size={12} className="mx-auto mt-0.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Custom amount input */}
        {isCustom && (
          <div className="rounded-xl p-3" style={glassInner}>
            <div className="flex items-center gap-2">
              <TokenUSDC variant="branded" size={18} />
              <input
                type="number"
                min="0.000001"
                step="1"
                placeholder="0.00"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className="flex-1 bg-transparent text-lg font-semibold tabular-nums outline-none placeholder:opacity-30"
                style={{ color: 'var(--ink)', fontFamily: "'Space Grotesk', sans-serif" }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>USDC</span>
            </div>
            {balanceFmt != null && (
              <p className="mt-1 text-xs" style={{ color: 'var(--subtle)' }}>
                Balance: ${balanceFmt} USDC
              </p>
            )}
          </div>
        )}

        {/* Optional fields */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Your name (optional)"
            maxLength={64}
            value={tipperName}
            onChange={e => setTipperName(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:opacity-40"
            style={{ ...glassInner, color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif" }}
          />
          <textarea
            placeholder="Leave a message (optional)"
            maxLength={256}
            rows={2}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:opacity-40"
            style={{ ...glassInner, color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif" }}
          />
          {message.length > 200 && (
            <p className="text-right text-[11px]" style={{ color: 'var(--muted)' }}>
              {256 - message.length} chars left
            </p>
          )}
        </div>

        {/* CTA */}
        {!isConnected ? (
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button
                onClick={show}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Connect Wallet to Tip
              </button>
            )}
          </ConnectKitButton.Custom>
        ) : (
          <button
            onClick={handleApprove}
            disabled={!canTip}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold transition-all disabled:opacity-40"
            style={{ background: isDone ? 'var(--success)' : 'var(--accent)', color: 'white' }}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {!isLoading && <Send size={16} />}
            {buttonLabel()}
          </button>
        )}

        <p className="text-center text-[11px]" style={{ color: 'var(--subtle)' }}>
          Two steps: approve USDC spend, then confirm tip
        </p>
      </div>
    </div>
  )
}
