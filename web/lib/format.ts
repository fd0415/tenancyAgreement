/**
 * 从条款全文里提取一个简短的小标题（供报告行/详情页做「条款位置」展示）。
 * 取首个非空行，截到第一个句读/冒号前，超长则省略。
 */
export function clauseLabel(text: string | null | undefined): string {
  if (!text) return ''
  const firstLine =
    text
      .replace(/\r/g, '')
      .split('\n')
      .map((s) => s.trim())
      .find(Boolean) ?? ''
  const head = firstLine.split(/[。；：:，,]/)[0].trim()
  return head.length > 24 ? `${head.slice(0, 24)}…` : head
}
