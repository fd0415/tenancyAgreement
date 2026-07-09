/**
 * 生成一份结构正确的测试 PDF（英文文本，用于冒烟测试 pdfjs 解析管道）。
 * 真实中文合同 PDF 会内嵌字体，可正常提取；此文件仅验证代码链路。
 * 运行：npx tsx scripts/make-test-pdf.ts
 */
import * as fs from 'fs'
import * as path from 'path'

const lines = [
  'RENTAL CONTRACT TEST DOCUMENT',
  'Article 1 Lease Term: from 2026-07-01 to 2027-06-30.',
  'Article 2 Rent: 6500 RMB per month, paid quarterly in cash.',
  'Article 3 Deposit: 13000 RMB, refunded within 30 working days.',
  'Article 4 Repair: all facilities maintained by tenant.',
  'Article 5 Early termination: deposit and rent non-refundable.',
]

// 构建内容流：每行下移
let text = 'BT /F1 14 Tf 72 720 Td 16 TL\n'
for (const l of lines) {
  const esc = l.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  text += `(${esc}) Tj T*\n`
}
text += 'ET'

const objects: string[] = []
objects.push('<</Type/Catalog/Pages 2 0 R>>')
objects.push('<</Type/Pages/Kids[3 0 R]/Count 1>>')
objects.push(
  '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>'
)
objects.push(`<</Length ${Buffer.byteLength(text)}>>\nstream\n${text}\nendstream`)
objects.push('<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>')

let pdf = '%PDF-1.4\n'
const offsets: number[] = []
objects.forEach((obj, i) => {
  offsets.push(Buffer.byteLength(pdf))
  pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
})

const xrefStart = Buffer.byteLength(pdf)
pdf += `xref\n0 ${objects.length + 1}\n`
pdf += '0000000000 65535 f \n'
for (const off of offsets) {
  pdf += `${String(off).padStart(10, '0')} 00000 n \n`
}
pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`

const out = path.join(process.cwd(), 'scripts', 'test-contract.pdf')
fs.writeFileSync(out, pdf, 'latin1')
console.log('✅ 已生成测试 PDF:', out, `(${Buffer.byteLength(pdf)} 字节)`)
