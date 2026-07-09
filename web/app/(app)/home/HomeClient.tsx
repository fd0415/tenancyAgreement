'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { HistoryItem } from '@/lib/history'

const SUGGESTS = ['帮我看看押金和退租条款', '我要签的整租合同', '根据合同类型自动挑重点']

const CONTRACT_TYPES = [
  {
    title: '整租合同',
    desc: '独立承租一整套房源，押金与租金支付方式是最常见的风险点',
    tags: ['押金', '租金', '解约'],
  },
  {
    title: '合租协议',
    desc: '与其他租客共同承租，需额外关注公共区域与连带责任划分',
    tags: ['连带责任', '公共区域'],
  },
  {
    title: '续租补充协议',
    desc: '到期续签时签署，重点看涨租幅度和新增的补充条款',
    tags: ['涨租', '续期条款'],
  },
]

const STEP_LABEL: Record<string, string> = {
  intent: '正在识别意图…',
  upload: '正在解析合同…',
  validate: '正在核验合同类型…',
}

function tierColor(score: number): string {
  if (score >= 80) return 'var(--low)'
  if (score >= 60) return 'var(--mid)'
  return 'var(--high)'
}
function tierBg(score: number): string {
  if (score >= 80) return 'var(--low-bg)'
  if (score >= 60) return 'var(--mid-bg)'
  return 'var(--high-bg)'
}

export default function HomeClient({ myContracts = [] }: { myContracts?: HistoryItem[] }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'types' | 'mine'>('types')
  const [prompt, setPrompt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<keyof typeof STEP_LABEL | null>(null)
  const [error, setError] = useState('')
  // 意图不相关 / 上传了非住房合同，统一走这一个「超出服务范围」提示
  const [blocked, setBlocked] = useState<{ reason: string } | null>(null)

  function pickFile() {
    fileInputRef.current?.click()
  }

  function validateAndSet(f: File | undefined) {
    if (!f) return
    const lower = f.name.toLowerCase()
    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx') && !lower.endsWith('.txt')) {
      setError('目前仅支持 PDF、DOCX 和 TXT 格式')
      return
    }
    setError('')
    setFile(f)
  }

  async function handleStart() {
    if (loading) return
    setError('')
    setBlocked(null)

    if (!file) {
      setError('请先上传合同文件')
      return
    }

    setLoading(true)
    try {
      // ── 第一道门：意图识别（仅当用户输入了文字）──
      if (prompt.trim()) {
        setStep('intent')
        const intentRes = await fetch('/api/contract/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim() }),
        })
        const intent = await intentRes.json()
        if (intent.intent === 'out_of_scope') {
          setBlocked({ reason: intent.reason ?? '' })
          return
        }
      }

      // ── 上传 + 解析 ──
      setStep('upload')
      const fd = new FormData()
      fd.append('file', file)
      if (prompt.trim()) fd.append('prompt', prompt.trim())
      const res = await fetch('/api/contract/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '上传失败')
        return
      }
      const contractId = data.contract.id

      // ── 第二道门：合同类型验证 ──
      setStep('validate')
      const vRes = await fetch('/api/contract/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      })
      const v = await vRes.json()
      if (!vRes.ok) {
        setError(v.error ?? '合同类型验证失败')
        return
      }
      if (!v.is_rental) {
        setBlocked({ reason: v.reason ?? '' })
        setFile(null)
        return
      }

      // ── 双门通过，进入审核 ──
      router.push(`/scan/${contractId}`)
    } catch {
      setError('网络异常，请稍后再试')
    } finally {
      setLoading(false)
      setStep(null)
    }
  }

  const fmtSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`

  return (
    <main className="relative flex-1 overflow-hidden px-[50px] pb-[50px] pt-16 text-center">
      {/* 背景光晕 */}
      <div
        className="pointer-events-none absolute -bottom-44 -left-20 h-[420px] w-[520px] opacity-[0.18]"
        style={{
          filter: 'blur(64px)',
          background:
            'radial-gradient(circle at 30% 30%, var(--purple), transparent 60%), radial-gradient(circle at 70% 40%, var(--blue), transparent 55%), radial-gradient(circle at 55% 75%, var(--orange), transparent 55%)',
        }}
      />

      <h1 className="relative z-10 mx-auto mb-[30px] max-w-[640px] text-[30px] font-black leading-[1.35] text-ink">
        告诉租房合同助手，你想审核的合同
      </h1>

      {/* Prompt 输入框（支持拖拽上传） */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          validateAndSet(e.dataTransfer.files?.[0])
        }}
        className={`relative z-10 mx-auto w-[680px] max-w-full rounded-[26px] border bg-surface px-6 pb-4 pt-[22px] text-left transition-colors ${
          dragOver ? 'border-accent bg-[var(--accent-bg)]' : 'border-line'
        }`}
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例如：朝阳区整租合同，押金两个月，重点帮我看解约和维修条款"
          rows={2}
          className="w-full resize-none border-none bg-transparent text-base leading-[1.65] text-ink outline-none placeholder:text-muted"
        />

        {/* 已选文件展示 */}
        {file && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-page px-3 py-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface text-accent">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M7 3h7l3 3v15H7V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M14 3v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-ink">{file.name}</div>
              <div className="text-[11px] text-muted">{fmtSize(file.size)}</div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-[12px] font-semibold text-muted hover:text-ink"
            >
              移除
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={pickFile}
              className="inline-flex items-center gap-[7px] rounded-full border border-line-strong bg-surface py-[9px] pl-[13px] pr-4 text-[13px] font-bold text-ink-soft hover:bg-page"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-[15px] w-[15px]">
                <path d="M7 3h7l3 3v15H7V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M14 3v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {file ? '重新上传' : '上传合同'}
            </button>
            {!file && (
              <span className="text-[12px] text-muted">支持 PDF / DOCX / TXT，也可直接拖入</span>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="inline-flex items-center gap-[7px] rounded-full border-none py-2.5 pl-5 pr-5 text-[13.5px] font-extrabold text-white disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--purple), var(--blue))',
              boxShadow: '0 6px 16px rgba(167,139,250,.32)',
            }}
          >
            {loading ? (step ? STEP_LABEL[step] : '处理中…') : '开始审核'}
            {!loading && (
              <svg viewBox="0 0 24 24" fill="none" className="h-[14px] w-[14px]">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />
      </div>

      {error && <p className="relative z-10 mt-3 text-[13px] font-semibold text-high">{error}</p>}

      {/* 超出服务范围（意图不相关 / 非住房合同，统一样式 · 设计稿 09）*/}
      {blocked ? (
        <div
          className="relative z-10 mx-auto mt-3 w-[680px] max-w-full rounded-2xl border px-5 py-4 text-left"
          style={{ background: 'var(--accent-bg)', borderColor: 'rgba(167,139,250,.35)' }}
        >
          <div
            className="mb-2 flex items-center gap-1.5 text-[12.5px] font-extrabold"
            style={{ color: 'var(--purple)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[15px] w-[15px]">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v5.5M12 16.5v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            超出服务范围
          </div>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            我是租房合同审核助手，目前只能审核租房合同文本或文件，比如押金退租、维修责任、违约赔偿这些条款。
            {blocked.reason || '你的问题不在我的支持范围内，没法帮你处理。'}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            你可以重新描述一份租房合同的问题，或者直接上传合同文件，我来帮你审核。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setPrompt('帮我看看押金和退租条款')
                setBlocked(null)
              }}
              className="rounded-full border border-line bg-surface px-3.5 py-[7px] text-[12px] font-bold text-ink-soft hover:bg-page"
            >
              帮我看看押金和退租条款
            </button>
            <button
              onClick={() => {
                setBlocked(null)
                pickFile()
              }}
              className="rounded-full border border-line bg-surface px-3.5 py-[7px] text-[12px] font-bold text-ink-soft hover:bg-page"
            >
              上传我的整租合同
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 服务范围提示 */}
          <div className="relative z-10 mt-3 flex items-start justify-center gap-1.5 text-[12px] leading-[1.6] text-muted">
            <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-[14px] w-[14px] flex-shrink-0">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 11v5.5M12 8v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>目前仅支持租房合同相关内容的审核，其他类型问题暂无法处理</span>
          </div>

          {/* 建议词 */}
          <div className="relative z-10 mt-[18px] flex flex-wrap justify-center gap-2.5">
            {SUGGESTS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="rounded-full border border-line bg-surface px-4 py-[9px] text-[12.5px] font-bold text-ink-soft hover:border-line-strong"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Tab：常见合同类型 / 我的合同 */}
      <div className="relative z-10 mt-[42px] text-left">
        <div className="mb-[18px] flex gap-[22px] border-b border-line text-sm font-extrabold">
          <button
            onClick={() => setTab('types')}
            className={`pb-2.5 transition-colors ${
              tab === 'types' ? 'border-b-2 border-ink text-ink' : 'text-muted hover:text-ink-soft'
            }`}
          >
            常见合同类型
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`pb-2.5 transition-colors ${
              tab === 'mine' ? 'border-b-2 border-ink text-ink' : 'text-muted hover:text-ink-soft'
            }`}
          >
            我的合同
          </button>
        </div>

        {tab === 'types' ? (
          <div className="grid grid-cols-3 gap-3.5">
            {CONTRACT_TYPES.map((c) => (
              <div key={c.title} className="rounded-[14px] border border-line bg-surface p-[18px]">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-extrabold text-ink">{c.title}</h4>
                  <span className="rounded-full bg-page px-[9px] py-0.5 text-[10px] font-bold text-muted">
                    示例
                  </span>
                </div>
                <p className="text-[12px] leading-[1.6] text-muted">{c.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-page px-[9px] py-[3px] text-[10.5px] font-bold text-ink-soft"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : myContracts.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-line-strong bg-surface p-10 text-center text-[13px] text-muted">
            还没有体检记录，上传一份合同开始吧
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3.5">
              {myContracts.map((c) => (
                <Link
                  key={c.reportId}
                  href={`/report/${c.reportId}`}
                  className="rounded-[14px] border border-line bg-surface p-[18px] transition-colors hover:border-line-strong"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="min-w-0 truncate text-sm font-extrabold text-ink">{c.fileName}</h4>
                    <span
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-black"
                      style={{ background: tierBg(c.score), color: tierColor(c.score) }}
                    >
                      {c.score}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-muted">{c.createdAt.slice(0, 10)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded px-1.5 py-0.5 text-[11px] font-bold" style={{ background: 'var(--high-bg)', color: 'var(--high)' }}>高{c.high}</span>
                    <span className="rounded px-1.5 py-0.5 text-[11px] font-bold" style={{ background: 'var(--mid-bg)', color: 'var(--mid)' }}>中{c.mid}</span>
                    <span className="rounded px-1.5 py-0.5 text-[11px] font-bold" style={{ background: 'var(--low-bg)', color: 'var(--low)' }}>低{c.low}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/history"
              className="mt-4 inline-block text-[13px] font-bold text-accent hover:underline"
            >
              查看全部历史记录 →
            </Link>
          </>
        )}
      </div>

    </main>
  )
}
