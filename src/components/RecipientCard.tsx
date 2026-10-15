import { useReadContract } from 'wagmi'
import { User } from 'lucide-react'
import { TIPJAR_ADDRESS, TIPJAR_ABI, TIPJAR_CHAIN_ID, RECIPIENT_A_LABEL, RECIPIENT_B_LABEL } from '../contract'
import { Amount, usdcDecimalsFor } from '../onchain-money'

interface RecipientCardProps {
  role: 'A' | 'B'
}

export function RecipientCard({ role }: RecipientCardProps) {
  const decimals = usdcDecimalsFor(TIPJAR_CHAIN_ID)
  const label = role === 'A' ? RECIPIENT_A_LABEL : RECIPIENT_B_LABEL

  const { data: bpsA } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: 'bpsA',
    chainId: TIPJAR_CHAIN_ID,
  })

  const { data: recipientAddr } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: role === 'A' ? 'recipientA' : 'recipientB',
    chainId: TIPJAR_CHAIN_ID,
  })

  const { data: pending } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: 'pendingBalance',
    args: [recipientAddr as `0x${string}`],
    chainId: TIPJAR_CHAIN_ID,
    query: { enabled: !!recipientAddr },
  })

  const bps = bpsA != null ? Number(bpsA) : null
  const pct = bps != null
    ? role === 'A' ? bps / 100 : (10000 - bps) / 100
    : null

  const pendingAmt = pending != null
    ? Amount.fromRaw(pending as bigint, decimals)
    : null

  const addrShort = recipientAddr
    ? `${(recipientAddr as string).slice(0, 6)}…${(recipientAddr as string).slice(-4)}`
    : '—'

  return (
    <div
      className="flex-1 rounded-xl p-3"
      style={{ background: 'rgba(18,45,69,0.04)', border: '1px solid rgba(18,45,69,0.08)' }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <User size={12} />
        </div>
        <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{label}</span>
      </div>
      <p
        className="display text-xl font-bold tabular-nums"
        style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
      >
        {pct != null ? `${pct}%` : '—'}
      </p>
      <p className="mt-0.5 text-[11px] mono" style={{ color: 'var(--subtle)' }}>{addrShort}</p>
      {pendingAmt != null && (
        <p className="mt-1.5 text-[11px] font-medium tabular-nums" style={{ color: 'var(--muted)' }}>
          ${Number(pendingAmt.toFixed(2)).toLocaleString()} pending
        </p>
      )}
    </div>
  )
}
