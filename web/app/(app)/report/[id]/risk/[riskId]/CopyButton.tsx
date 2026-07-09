'use client'

import { useState } from 'react'
import { useToast } from '@/components/common/Toast'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast('已复制修改建议', 'success')
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast('复制失败，请手动选择文本', 'error')
    }
  }

  return (
    <button
      onClick={copy}
      className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-black-btn px-5 text-[13.5px] font-bold text-white hover:bg-black"
    >
      {copied ? '已复制 ✓' : '复制修改建议'}
    </button>
  )
}
