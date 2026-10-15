import { useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { Target } from 'lucide-react'
import { TIPJAR_ADDRESS, TIPJAR_ABI, TIPJAR_CHAIN_ID } from '../contract'
import { Amount, usdcDecimalsFor } from '../onchain-money'

interface GoalCardProps {
  onTipSuccess: boolean
}

const glass = {
  background: 'rgba(255,255,255,0.64)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.68)',
  boxShadow: '0 8px 32px rgba(18,45,69,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
} as React.CSSProperties

export function GoalCard({ onTipSuccess }: GoalCardProps) {
  const decimals = usdcDecimalsFor(TIPJAR_CHAIN_ID)

  const { data: totalReceived, refetch: refetchTotal } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: 'totalReceived',
    chainId: TIPJAR_CHAIN_ID,
  })

  const { data: goalAmount, refetch: refetchGoal } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: 'goalAmount',
    chainId: TIPJAR_CHAIN_ID,
  })

  const { data: tipCount, refetch: refetchCount } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: 'tipCount',
    chainId: TIPJAR_CHAIN_ID,
  })

  useEffect(() => {
    void refetchTotal()
    void refetchGoal()
    void refetchCount()
  }, [onTipSuccess, refetchTotal, refetchGoal, refetchCount])

  const total = totalReceived != null
    ? Amount.fromRaw(totalReceived as bigint, decimals)
    : null

  const goal = goalAmount != null
    ? Amount.fromRaw(goalAmount as bigint, decimals)
    : null

  const count = tipCount != null ? Number(tipCount) : null

  const progressPct = total != null && goal != null && Number(goal.toFixed(6)) > 0
    ? Math.min(100, (Number(total.toFixed(6)) / Number(goal.toFixed(6))) * 100)
    : 0

  const remaining = total != null && goal != null
    ? Math.max(0, Number(goal.toFixed(6)) - Number(total.toFixed(6)))
    : null

  return (
    <div className="rounded-3xl p-6" style={glass}>
      {/* Total raised */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Total raised
          </p>
          <p
            className="display mt-1 text-4xl font-bold tabular-nums"
            style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
          >
            {total != null ? `$${Number(total.toFixed(2)).toLocaleString()}` : '—'}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--subtle)' }}>
            USDC
            {count != null && count > 0 && (
              <span> &middot; {count.toLocaleString()} {count === 1 ? 'tip' : 'tips'}</span>
            )}
          </p>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Target size={22} />
        </div>
      </div>

      {/* Progress bar */}
      {goal != null && Number(goal.toFixed(6)) > 0 && (
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              Goal: ${Number(goal.toFixed(2)).toLocaleString()} USDC
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
              {progressPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(18,45,69,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: progressPct >= 100
                  ? 'var(--success)'
                  : 'linear-gradient(90deg, #122d45, #1061a6)',
              }}
            />
          </div>
          {remaining != null && remaining > 0 && (
            <p className="mt-1.5 text-xs tabular-nums" style={{ color: 'var(--subtle)' }}>
              ${remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC remaining
            </p>
          )}
          {progressPct >= 100 && (
            <p className="mt-1.5 text-xs font-semibold" style={{ color: 'var(--success)' }}>
              Goal reached!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
