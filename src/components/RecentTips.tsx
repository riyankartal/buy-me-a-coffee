import { useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { MessageSquare, Clock } from 'lucide-react'
import { TIPJAR_ADDRESS, TIPJAR_ABI, TIPJAR_CHAIN_ID } from '../contract'
import { Amount, usdcDecimalsFor } from '../onchain-money'

interface RecentTipsProps {
  refreshTrigger: boolean
}

function relativeTime(ts: number): string {
  const now = Date.now() / 1000
  const diff = now - ts
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(ts * 1000).toLocaleDateString()
}

const glass = {
  background: 'rgba(255,255,255,0.64)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.68)',
  boxShadow: '0 8px 32px rgba(18,45,69,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
} as React.CSSProperties

export function RecentTips({ refreshTrigger }: RecentTipsProps) {
  const decimals = usdcDecimalsFor(TIPJAR_CHAIN_ID)

  const { data, isLoading, refetch } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: 'getRecentTips',
    chainId: TIPJAR_CHAIN_ID,
  })

  useEffect(() => {
    void refetch()
  }, [refreshTrigger, refetch])

  // data is [tippers[], amounts[], names[], messages[], timestamps[]]
  const tippers = data ? (data as unknown[][])[0] as string[] : []
  const amounts = data ? (data as unknown[][])[1] as bigint[] : []
  const names = data ? (data as unknown[][])[2] as string[] : []
  const messages = data ? (data as unknown[][])[3] as string[] : []
  const timestamps = data ? (data as unknown[][])[4] as bigint[] : []

  // Build tip list, filter empty slots (timestamp == 0), sort newest first
  const tips = tippers
    .map((tipper, i) => ({
      tipper: tipper,
      amount: amounts[i] ?? 0n,
      name: names[i] ?? '',
      message: messages[i] ?? '',
      timestamp: Number(timestamps[i] ?? 0n),
    }))
    .filter(t => t.timestamp > 0)
    .sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="rounded-3xl p-5" style={glass}>
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare size={14} style={{ color: 'var(--muted)' }} />
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Recent Tips
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-2xl" style={{ background: 'rgba(18,45,69,0.05)' }} />
          ))}
        </div>
      )}

      {!isLoading && tips.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--subtle)' }}>No tips yet — be the first!</p>
        </div>
      )}

      {!isLoading && tips.length > 0 && (
        <div className="space-y-2">
          {tips.map((tip, i) => {
            const amt = Amount.fromRaw(tip.amount, decimals)
            const displayName = tip.name.trim() || `${tip.tipper.slice(0, 6)}…${tip.tipper.slice(-4)}`
            return (
              <div
                key={i}
                className="rounded-2xl p-3.5"
                style={{ background: 'rgba(18,45,69,0.04)', border: '1px solid rgba(18,45,69,0.07)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      {displayName}
                    </p>
                    {tip.message.trim() && (
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-2)', textWrap: 'pretty' }}>
                        {tip.message}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                      ${Number(amt.toFixed(2)).toLocaleString()}
                    </p>
                    <div className="mt-0.5 flex items-center justify-end gap-1">
                      <Clock size={10} style={{ color: 'var(--subtle)' }} />
                      <p className="text-[11px] tabular-nums" style={{ color: 'var(--subtle)' }}>
                        {relativeTime(tip.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
