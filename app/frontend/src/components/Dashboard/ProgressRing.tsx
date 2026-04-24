interface ProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  sublabel?: string
}

export default function ProgressRing({
  percentage,
  size = 180,
  strokeWidth = 14,
  color = '#7c3aed',
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1c2133" strokeWidth={strokeWidth} />
        {/* Glow layer */}
        <circle
          cx={cx} cy={cy} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth + 4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity={0.15}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-bold text-white tabular-nums">{percentage}%</span>
        {label && <span className="text-xs text-slate-400 mt-1">{label}</span>}
        {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
      </div>
    </div>
  )
}
