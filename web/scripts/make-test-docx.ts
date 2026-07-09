/**
 * 生成一份测试用 DOCX 租房合同（内容取自设计稿示例）。
 * 运行：npx tsx scripts/make-test-docx.ts
 * 输出：scripts/test-contract.docx
 */
import JSZip from 'jszip'
import * as fs from 'fs'
import * as path from 'path'

const PARAGRAPHS = [
  '房屋租赁合同',
  '甲方（出租方）：张某某',
  '乙方（承租方）：李明',
  '第一条 房屋基本情况',
  '房屋位于北京市朝阳区 XX 小区 3 号楼 2 单元 1502 室，建筑面积 89 平方米，精装修，家具家电齐全。',
  '第二条 租赁期限',
  '租赁期限为壹年，自 2026 年 7 月 1 日至 2027 年 6 月 30 日。',
  '第三条 租金及支付方式',
  '月租金为人民币 6500 元，乙方应于每季度初一次性支付三个月租金共计 19,500 元。租金仅接受现金支付。',
  '第四条 押金',
  '乙方应于签约当日支付押金人民币 13,000 元（相当于两个月租金）。租赁期满且房屋及设施无损坏后，甲方在 30 个工作日内退还押金。',
  '第五条 房屋维修责任',
  '租赁期间，房屋内所有设施设备（包括但不限于空调、热水器、马桶、水管、电路、门窗）的维修费用由乙方承担。',
  '第六条 提前解除合同',
  '租赁期内乙方提前解除合同，已支付的租金及押金不予退还，另需支付一个月租金作为违约金。',
  '第七条 其他费用',
  '租赁期间产生的水费、电费、燃气费、网费、物业费、供暖费均由乙方承担。',
  '第八条 续租条款',
  '租赁期满前 30 日，双方未提出异议的，本合同自动续期一年，租金上涨 10%。',
  '第九条 房屋使用限制',
  '乙方不得饲养宠物，不得擅自改变房屋结构或进行装修。',
  '第十条 争议解决',
  '双方发生争议协商不成的，向甲方所在地人民法院提起诉讼。',
  '甲方（签字）：张某某          乙方（签字）：李明',
  '日期：2026 年 6 月 28 日',
]

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const body = PARAGRAPHS.map(
  (p) => `<w:p><w:r><w:t xml:space="preserve">${esc(p)}</w:t></w:r></w:p>`
).join('')

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}<w:sectPr/></w:body>
</w:document>`

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

async function main() {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', contentTypes)
  zip.folder('_rels')!.file('.rels', rels)
  zip.folder('word')!.file('document.xml', documentXml)

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })
  const out = path.join(process.cwd(), 'scripts', 'test-contract.docx')
  fs.writeFileSync(out, buffer)
  console.log('✅ 已生成测试合同:', out, `(${buffer.length} 字节)`)
}

main()
