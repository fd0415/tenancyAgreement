import { GUEST_USER_ID } from '@/lib/guest'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeClause } from '@/lib/analyze'
import { computeHealthScore } from '@/lib/scoring'
import type { Clause, ScanEvent } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 300

/** 太短或纯信息型的片段跳过分析（前言/签字等） */
function isAnalyzable(c: Clause): boolean {
  return c.text.trim().length >= 12
}

export async function POST(request: Request) {
  let body: { contractId?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: '请求格式错误' }), { status: 400 })
  }
  const contractId = body.contractId
  if (!contractId) {
    return new Response(JSON.stringify({ error: '缺少合同 ID' }), { status: 400 })
  }

  // 读取合同
  const { data: contract, error } = await supabaseAdmin
    .from('contracts')
    .select('id, clauses, focus_areas')
    .eq('id', contractId)
    .maybeSingle()

  if (error || !contract) {
    return new Response(JSON.stringify({ error: '合同不存在' }), { status: 404 })
  }

  const clauses = (Array.isArray(contract.clauses) ? contract.clauses : []) as Clause[]
  const focusAreas = (contract.focus_areas as string[] | null) ?? undefined
  const targets = clauses.filter(isAnalyzable)

  // 创建扫描报告
  const { data: report, error: repErr } = await supabaseAdmin
    .from('scan_reports')
    .insert({
      contract_id: contract.id,
      user_id: GUEST_USER_ID,
      status: 'scanning',
    })
    .select('id')
    .single()

  if (repErr || !report) {
    return new Response(JSON.stringify({ error: '创建报告失败' }), { status: 500 })
  }
  const reportId = report.id as string

  const CONCURRENCY = 10

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const send = (ev: ScanEvent) => {
        if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`))
      }

      const counts = { high: 0, mid: 0, low: 0 }
      let sortOrder = 0
      let done = 0

      try {
        const total = targets.length
        let cursor = 0

        // 并发工作池：多条条款同时分析，结果按完成顺序流式推送
        async function worker() {
          while (true) {
            const i = cursor++
            if (i >= total) break
            const clause = targets[i]
            send({
              type: 'reading',
              clause_id: clause.id,
              clause_text: clause.text,
              index: i,
              total,
            })

            const result = await analyzeClause(clause.text, focusAreas)
            done += 1

            if (!result.has_risk || result.severity === 'none') {
              send({ type: 'safe', clause_id: clause.id, done, total })
              continue
            }

            counts[result.severity] += 1
            const risk = {
              clause_id: clause.id,
              severity: result.severity,
              title: result.title,
              description: result.description,
              suggestion: result.suggestion,
              original_text: clause.text,
              suggested_text: result.suggested_text,
              sort_order: sortOrder++,
            }
            await supabaseAdmin.from('risk_items').insert({ report_id: reportId, ...risk })
            send({ type: 'risk', risk, done, total })
          }
        }

        await Promise.all(
          Array.from({ length: Math.min(CONCURRENCY, total || 1) }, () => worker())
        )

        const healthScore = computeHealthScore(counts)
        await supabaseAdmin
          .from('scan_reports')
          .update({
            status: 'done',
            health_score: healthScore,
            high_count: counts.high,
            mid_count: counts.mid,
            low_count: counts.low,
          })
          .eq('id', reportId)

        send({
          type: 'done',
          health_score: healthScore,
          report_id: reportId,
          high: counts.high,
          mid: counts.mid,
          low: counts.low,
        })
      } catch (e) {
        console.error('[scan] error:', e)
        await supabaseAdmin
          .from('scan_reports')
          .update({ status: 'failed' })
          .eq('id', reportId)
        send({ type: 'error', message: '审核过程中出错，请重试' })
      } finally {
        closed = true
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
