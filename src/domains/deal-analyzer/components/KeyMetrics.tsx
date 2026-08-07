import { motion } from 'motion/react'

interface KeyMetricsProps {
  estimatedPrice: string
  listingPrice: string
  difference: string
  differenceInk: string
}

/** Crossfades when the value changes, so numbers update rather than snap. */
function AnimatedValue({ children, className }: { children: string; className: string }) {
  return (
    <motion.span
      key={children}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.span>
  )
}

function Metric({ label, value, ink = 'text-ink' }: {
  label: string
  value: string
  ink?: string
}) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0">
      <dt className="truncate text-[10px] font-medium tracking-wide text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold tracking-tight tabular-nums">
        <AnimatedValue className={ink}>{value}</AnimatedValue>
      </dd>
    </div>
  )
}

export function KeyMetrics({
  estimatedPrice,
  listingPrice,
  difference,
  differenceInk,
}: KeyMetricsProps) {
  return (
    <dl className="grid grid-cols-3 divide-x divide-border-hairline">
      <Metric label="AI estimate" value={estimatedPrice} />
      <Metric label="Listing" value={listingPrice} />
      <Metric label="vs market" value={difference} ink={differenceInk} />
    </dl>
  )
}
