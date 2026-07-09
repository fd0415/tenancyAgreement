export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-[46px] w-[46px] rounded-[10px]'
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-[22px] w-[22px]'
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center ${box}`}
      style={{
        background: 'linear-gradient(145deg, var(--purple), var(--blue))',
        boxShadow: '0 4px 10px rgba(167,139,250,.18)',
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" className={icon}>
        <path
          d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M14 3.5V8h4" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
        <path
          d="M8.5 13.5l2 2 4-4.5"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
