// ─── 数据库行类型 ────────────────────────────────────────────

export interface User {
  id: string
  username: string
  password_hash: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  user_id: string
  file_name: string
  file_url: string
  file_type: 'pdf' | 'docx' | 'txt'
  raw_text: string | null
  clauses: Clause[] | null
  contract_type: 'rental' | 'unknown'
  focus_areas: string[] | null
  user_prompt: string | null
  created_at: string
}

export interface Clause {
  id: string
  text: string
  index: number
}

export interface ScanReport {
  id: string
  contract_id: string
  user_id: string
  health_score: number | null
  high_count: number
  mid_count: number
  low_count: number
  status: 'scanning' | 'done' | 'failed'
  created_at: string
  updated_at: string
}

export interface RiskItem {
  id: string
  report_id: string
  clause_id: string
  severity: 'high' | 'mid' | 'low' | 'none'
  title: string | null
  description: string | null
  suggestion: string | null
  original_text: string | null
  suggested_text: string | null
  sort_order: number
  created_at: string
}

// ─── API 响应类型 ────────────────────────────────────────────

export interface ApiError {
  error: string
  code?: string
}

export interface IntentResult {
  intent: 'contract_review' | 'out_of_scope'
  focus_areas: string[]
  reason: string
}

export interface ValidateResult {
  is_rental: boolean
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

// ─── 流式扫描事件 ────────────────────────────────────────────

export type ScanEvent =
  | { type: 'reading'; clause_id: string; clause_text: string; index: number; total: number }
  | { type: 'risk'; risk: Omit<RiskItem, 'id' | 'report_id' | 'created_at'>; done: number; total: number }
  | { type: 'safe'; clause_id: string; done: number; total: number }
  | { type: 'done'; health_score: number; report_id: string; high: number; mid: number; low: number }
  | { type: 'error'; message: string }
