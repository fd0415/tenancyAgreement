-- ============================================================
-- 租约体检 · Supabase 数据库 Schema
-- 在 Supabase Dashboard → SQL Editor 中执行此文件
-- ============================================================

-- 0. 开启 pgvector 扩展（RAG 知识库用）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. 用户表
--    账号名 + bcrypt 密码，由管理员脚本预创建，无自助注册
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT        UNIQUE NOT NULL,       -- 账号名，如 zf_8821
  password_hash TEXT        NOT NULL,              -- bcrypt 哈希
  display_name  TEXT,                              -- 昵称（可选）
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. 合同文件表
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name     TEXT        NOT NULL,
  file_url      TEXT        NOT NULL,              -- Supabase Storage URL
  file_type     TEXT        NOT NULL,              -- 'pdf' | 'docx' | 'image'
  raw_text      TEXT,                              -- 解析后的纯文本
  clauses       JSONB,                             -- 条款切片数组 [{id, text}]
  contract_type TEXT        DEFAULT 'unknown',     -- 'rental' | 'unknown'
  focus_areas   JSONB,                             -- 用户关注的重点 ['押金','解约']
  user_prompt   TEXT,                              -- 用户原始输入
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 扫描报告表
-- ============================================================
CREATE TABLE IF NOT EXISTS scan_reports (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  health_score  INTEGER     CHECK (health_score BETWEEN 0 AND 100),
  high_count    INTEGER     DEFAULT 0,
  mid_count     INTEGER     DEFAULT 0,
  low_count     INTEGER     DEFAULT 0,
  status        TEXT        DEFAULT 'scanning',    -- 'scanning' | 'done' | 'failed'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. 风险条款明细表
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id      UUID        NOT NULL REFERENCES scan_reports(id) ON DELETE CASCADE,
  clause_id      TEXT        NOT NULL,             -- 对应 contracts.clauses 中的 id
  severity       TEXT        NOT NULL,             -- 'high' | 'mid' | 'low' | 'none'
  title          TEXT,                             -- 风险标题
  description    TEXT,                             -- 风险说明
  suggestion     TEXT,                             -- 修改建议文字
  original_text  TEXT,                             -- 原始条款文本
  suggested_text TEXT,                             -- 建议修改后的文本
  sort_order     INTEGER     DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. RAG 知识库（pgvector）
--    存储租房法规 / 风险规则 / 修改建议等知识文档切片
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT        NOT NULL,
  embedding   vector(1024),                       -- Deepseek embedding 维度
  source      TEXT,                               -- 来源文件名，如 '住房租赁条例.txt'
  chunk_index INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 向量相似度索引（余弦距离，查询更快）
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- 6. 辅助索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_contracts_user_id    ON contracts     (user_id);
CREATE INDEX IF NOT EXISTS idx_scan_reports_user_id ON scan_reports  (user_id);
CREATE INDEX IF NOT EXISTS idx_risk_items_report_id ON risk_items    (report_id);

-- ============================================================
-- 7. updated_at 自动更新触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_scan_reports_updated_at
  BEFORE UPDATE ON scan_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
