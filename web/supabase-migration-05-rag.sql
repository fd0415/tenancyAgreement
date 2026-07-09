-- ============================================================
-- 05 模块 · RAG 知识库增强
-- 在 Supabase SQL Editor 里执行本文件（可重复执行）
-- ============================================================

-- 1. 给 knowledge_chunks 增加结构化字段（审核项 / 风险等级 / 稳定业务键 / 元数据）
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS title       TEXT;   -- 审核项
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS risk_level  TEXT;   -- 高风险 / 中风险 / 低风险
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS ref_key     TEXT;   -- 稳定业务键，用于 upsert 去重（如 rule-0）
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS metadata    JSONB DEFAULT '{}'::jsonb;

-- ref_key 唯一约束：重复灌库时按业务键覆盖而非新增
CREATE UNIQUE INDEX IF NOT EXISTS uq_knowledge_chunks_ref_key
  ON knowledge_chunks (ref_key);

-- 2. 向量索引：ivfflat → hnsw（空表可建、召回更高）
DROP INDEX IF EXISTS idx_knowledge_chunks_embedding;
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- 3. 相似度检索函数：给定查询向量，返回最相近的 N 条规则
--    相似度 = 1 - 余弦距离（越接近 1 越相关）
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1024),
  match_count     INT DEFAULT 5,
  min_similarity  FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  title       TEXT,
  risk_level  TEXT,
  source      TEXT,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kc.id,
    kc.content,
    kc.title,
    kc.risk_level,
    kc.source,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) >= min_similarity
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;
