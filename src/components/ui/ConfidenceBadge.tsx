import { cn } from '../../lib/utils'

interface ConfidenceBadgeProps {
  /** AI confidence score in [0.0, 1.0]. Null/undefined shows a grey dash. */
  score: number | null | undefined
  /** Show the numeric percentage. Default true. */
  showPercent?: boolean
  className?: string
}

/**
 * Renders a colour-coded badge for AI confidence scores:
 *  0.85  -> green  (auto-accept)
 * 0.60-0.84 -> amber (review suggested)
 * < 0.60  -> red   (manual verification required)
 * null    -> grey  (field not found)
 */
export function ConfidenceBadge({ score, showPercent = true, className }: ConfidenceBadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'

  if (score == null) {
    return (
      <span className={cn(base, 'bg-gray-100 text-gray-400', className)}>
        -
      </span>
    )
  }

  if (score >= 0.85) {
    return (
      <span className={cn(base, 'bg-green-100 text-green-700', className)}>
        {showPercent ? `${(score * 100).toFixed(0)}%` : 'High'}
      </span>
    )
  }

  if (score >= 0.60) {
    return (
      <span className={cn(base, 'bg-amber-100 text-amber-700', className)}>
        {showPercent ? `${(score * 100).toFixed(0)}%` : 'Medium'}
      </span>
    )
  }

  return (
    <span className={cn(base, 'bg-red-100 text-red-700', className)}>
      {showPercent ? `${(score * 100).toFixed(0)}%` : 'Low'}
    </span>
  )
}
