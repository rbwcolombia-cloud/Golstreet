import { cn } from '@/lib/utils'

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
        <rect width="32" height="32" rx="8" fill="#020617" />
        <circle cx="16" cy="16" r="11" stroke="#22C55E" strokeWidth="1.5" opacity="0.35" />
        <polyline
          points="6,22 11,17 15,20 22,12 26,10"
          stroke="#22C55E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="23,7.5 26,10 23.5,13"
          stroke="#22C55E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
        <rect width="32" height="32" rx="8" fill="oklch(0.19 0.07 148 / 0.15)" />
        <circle cx="16" cy="16" r="11" stroke="#22C55E" strokeWidth="1.5" opacity="0.4" />
        <polyline
          points="6,22 11,17 15,20 22,12 26,10"
          stroke="#22C55E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="23,7.5 26,10 23.5,13"
          stroke="#22C55E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
