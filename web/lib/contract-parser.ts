import mammoth from 'mammoth'
import type { Clause } from '@/types'

export type ParsedFileType = 'pdf' | 'docx' | 'txt'

/**
 * 从 PDF 二进制中提取纯文本（使用 pdfjs-dist legacy 构建，适配 Node 环境）。
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  // unpdf 内置免 worker 的 pdfjs，适配 Node / Serverless / Turbopack
  const { getDocumentProxy, extractText } = await import('unpdf')
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return Array.isArray(text) ? text.join('\n\n') : text
}

/**
 * 从 DOCX 二进制中提取纯文本。
 */
async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

/**
 * 从 TXT 二进制中提取纯文本（UTF-8）。
 */
function parseTxt(buffer: Buffer): string {
  return buffer.toString('utf-8')
}

/**
 * 统一入口：根据文件类型解析出纯文本。
 */
export async function extractText(
  buffer: Buffer,
  fileType: ParsedFileType
): Promise<string> {
  let text: string
  if (fileType === 'pdf') text = await parsePdf(buffer)
  else if (fileType === 'docx') text = await parseDocx(buffer)
  else text = parseTxt(buffer)
  return normalizeText(text)
}

/**
 * 清洗文本：合并多余空行、去除行首尾空白。
 */
function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 支持的条款「标题」样式，按优先级从高到低排列。
 * 命中第一个「至少出现 2 次」的样式即用它切条，避免子项（如条内的「（一）」）过度切分。
 * 均以行首（m 标志）锚定，配合 normalizeText 已按行 trim 的文本。
 */
// 标题可出现在：字符串开头 / 行首 / 句末标点（。；！）之后
const AT = '(?:^|(?<=[。；！\\n]))'
const HEADING_PATTERNS: RegExp[] = [
  // 第一条 / 第1条 / 第 二 条
  new RegExp(`${AT}第\\s*[一二三四五六七八九十百零〇0-9]+\\s*条`, 'gm'),
  // 一、 二、 十一、 （中文序号 + 、．.）
  new RegExp(`${AT}[一二三四五六七八九十]+\\s*[、．.]`, 'gm'),
  // （一）(一) （二）等中文括号序号
  new RegExp(`${AT}[（(]\\s*[一二三四五六七八九十]+\\s*[)）]`, 'gm'),
  // 1. 2、 3） 等阿拉伯数字序号
  new RegExp(`${AT}\\d+\\s*[、.．)）]`, 'gm'),
]

/** 按给定标题正则切条；命中 <2 返回 null。 */
function sliceByHeading(text: string, regex: RegExp): Clause[] | null {
  const matches = [...text.matchAll(regex)]
  if (matches.length < 2) return null

  const clauses: Clause[] = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length
    const chunk = text.slice(start, end).trim()
    if (chunk) clauses.push({ id: `clause_${i + 1}`, text: chunk, index: i })
  }

  // 开头（标题/甲乙方信息等）作为前言
  const preface = text.slice(0, matches[0].index!).trim()
  if (preface) clauses.unshift({ id: 'preface', text: preface, index: -1 })

  return clauses
}

/**
 * 将合同全文切分为条款数组。
 * 依次尝试「第X条 / 一、二、三 / （一） / 1.」等标题样式；
 * 全部识别失败时，按空行分段兜底。
 */
export function splitClauses(text: string): Clause[] {
  for (const pattern of HEADING_PATTERNS) {
    const clauses = sliceByHeading(text, pattern)
    if (clauses) return clauses
  }

  // 兜底：按空行分段
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  return paragraphs.map((p, i) => ({ id: `para_${i + 1}`, text: p, index: i }))
}

/**
 * 根据 MIME / 文件名判断文件类型。
 */
export function detectFileType(fileName: string, mime: string): ParsedFileType | null {
  const lower = fileName.toLowerCase()
  if (mime === 'application/pdf' || lower.endsWith('.pdf')) return 'pdf'
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    return 'docx'
  }
  if (mime === 'text/plain' || lower.endsWith('.txt')) return 'txt'
  return null
}
