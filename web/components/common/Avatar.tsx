// 根据账号名（seed）稳定生成一个随机头像：
// 同一账号每次都得到相同的渐变配色，不同账号自动区分。

const GRADIENTS: [string, string][] = [
  ['#a78bfa', '#7dabf5'], // 紫 → 蓝（品牌默认）
  ['#fda4af', '#fdba74'], // 粉 → 橙
  ['#5eead4', '#86efac'], // 青 → 绿
  ['#60a5fa', '#22d3ee'], // 蓝 → 天青
  ['#c084fc', '#f472b6'], // 紫罗兰 → 粉
  ['#fbbf24', '#fb7185'], // 琥珀 → 珊瑚红
  ['#34d399', '#2dd4bf'], // 翠绿 → 青绿
  ['#818cf8', '#f0abfc'], // 靛蓝 → 淡紫
]

// 简单稳定哈希：把字符串映射为一个非负整数
function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0 // 转成 32 位整数
  }
  return Math.abs(hash)
}

function initialOf(seed: string): string {
  const trimmed = seed.trim()
  if (!trimmed) return '?'
  return Array.from(trimmed)[0].toUpperCase()
}

interface AvatarProps {
  seed: string
  size?: number
  className?: string
  title?: string
}

export function Avatar({ seed, size = 40, className = '', title }: AvatarProps) {
  const [from, to] = GRADIENTS[hashString(seed) % GRADIENTS.length]
  const letter = initialOf(seed)

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-black text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: `linear-gradient(145deg, ${from}, ${to})`,
      }}
      title={title ?? seed}
      aria-label={`${seed} 的头像`}
    >
      {letter}
    </div>
  )
}

export default Avatar
