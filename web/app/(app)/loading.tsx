export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="app-spinner" />
        <span className="text-[12.5px] text-muted">加载中…</span>
      </div>
    </div>
  )
}
