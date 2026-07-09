import OpenAI from 'openai'

/**
 * DeepSeek API 封装
 * 官方 OpenAI 兼容接口：https://api.deepseek.com
 * 模型：
 *   - deepseek-v4-flash：快、便宜 → 意图识别 / 合同类型验证
 *   - deepseek-v4-pro：强 → 合同条款逐条分析
 */

export const DEEPSEEK_MODELS = {
  flash: 'deepseek-v4-flash',
  pro: 'deepseek-v4-pro',
} as const

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

/**
 * 便捷方法：以 JSON 模式调用，返回解析后的对象。
 * 适用于意图识别 / 类型验证等需要结构化输出的场景。
 */
export async function chatJSON<T>(opts: {
  model?: string
  system: string
  user: string
  temperature?: number
}): Promise<T> {
  const res = await deepseek.chat.completions.create({
    model: opts.model ?? DEEPSEEK_MODELS.flash,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    response_format: { type: 'json_object' },
    temperature: opts.temperature ?? 0,
  })
  const raw = res.choices[0]?.message?.content ?? ''
  // 去除可能的 ```json 代码围栏并 trim
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim()
  if (!cleaned) throw new Error('模型返回内容为空')
  return JSON.parse(cleaned) as T
}
