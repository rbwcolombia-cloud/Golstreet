import { cn } from '@/lib/utils'

// ── Símbolo compartido: pelota de fútbol sobre chart de mercado ──
function LogoSymbol({ bg }: { bg: 'solid' | 'glass' }) {
  const bgFill = bg === 'solid' ? '#040c14' : 'oklch(0.18 0.06 148 / 0.18)'
  return (
    <>
      <defs>
        <linearGradient id="gs-lg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stopColor="#84cc16" />
          <stop offset="50%"  stopColor="#22c55e" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <filter id="gs-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="gs-glow2" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="32" height="32" rx="7" fill={bgFill} />

      {/* Chart zigzag — bottom-left trending up */}
      <polyline
        points="3,26 7,21 11,24 16,17"
        stroke="url(#gs-lg)" strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#gs-glow)"
      />

      {/* Arrow line — from chart peak to upper-right */}
      <line
        x1="16" y1="17" x2="26" y2="7"
        stroke="#22d3ee" strokeWidth="2"
        strokeLinecap="round"
        filter="url(#gs-glow)"
      />

      {/* Arrowhead */}
      <polyline
        points="23,6 26,7 25,10"
        stroke="#22d3ee" strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#gs-glow)"
      />

      {/* Soccer ball — riding the chart/arrow peak */}
      <circle
        cx="19" cy="13" r="5"
        fill={bgFill} stroke="url(#gs-lg)" strokeWidth="1.4"
        filter="url(#gs-glow2)"
      />
      {/* Pentagon center patch */}
      <polygon
        points="19,10 21,11.4 20.2,13.6 17.8,13.6 17,11.4"
        fill="none" stroke="#22c55e" strokeWidth="0.55" opacity="0.75"
      />
      {/* Ball seam lines */}
      <line x1="19"   y1="8"    x2="19"   y2="10"   stroke="#22d3ee" strokeWidth="0.55" opacity="0.65" />
      <line x1="21"   y1="11.4" x2="22.8" y2="10.6" stroke="#22d3ee" strokeWidth="0.55" opacity="0.65" />
      <line x1="20.2" y1="13.6" x2="21.2" y2="15.2" stroke="#22c55e" strokeWidth="0.55" opacity="0.65" />
      <line x1="17.8" y1="13.6" x2="16.8" y2="15.2" stroke="#22c55e" strokeWidth="0.55" opacity="0.65" />
      <line x1="17"   y1="11.4" x2="15.2" y2="10.6" stroke="#22d3ee" strokeWidth="0.55" opacity="0.65" />

      {/* Sparkle dots at chart valleys/peaks */}
      <circle cx="7"  cy="21" r="0.9" fill="#84cc16" opacity="0.9" filter="url(#gs-glow)" />
      <circle cx="11" cy="24" r="0.7" fill="#22c55e" opacity="0.7" />
      <circle cx="26" cy="7"  r="0.9" fill="#22d3ee" opacity="0.9" filter="url(#gs-glow)" />
    </>
  )
}

interface LogoGolStreetProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon'
}

const sizes = {
  sm: { icon: 24, text: 18, gap: 8 },
  md: { icon: 32, text: 24, gap: 10 },
  lg: { icon: 44, text: 32, gap: 14 },
}

export function LogoGolStreet({
  className,
  size = 'md',
  variant = 'full',
}: LogoGolStreetProps) {
  const s = sizes[size]
  const iconSize = s.icon

  if (variant === 'icon') {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0', className)}
        aria-label="GolStreet"
      >
        <LogoSymbol bg="solid" />
      </svg>
    )
  }

  return (
    <span className={cn('inline-flex items-center', className)} style={{ gap: s.gap }}>
      {/* Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <LogoSymbol bg="glass" />
      </svg>

      {/* Wordmark */}
      <span
        className="font-bold tracking-tight leading-none select-none"
        style={{ fontSize: s.text }}
      >
        <span className="text-emerald-400">Gol</span>
        <span className="text-slate-50">Street</span>
      </span>
    </span>
  )
}
