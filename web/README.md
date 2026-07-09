# 租约体检 · AI 合同审核

面向年轻人 / 应届生的租房合同 AI 审核工具。上传合同 → AI 逐条扫描风险 → 生成健康度体检报告 + 修改建议。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 + 后端 | Next.js 16 (App Router) + TypeScript |
| UI | TailwindCSS v4 |
| 主力大模型 | Deepseek V4 Pro（条款分析 + 图片 OCR） |
| 快速大模型 | Deepseek V4 Flash（意图识别 + 合同类型验证） |
| Embedding | Deepseek text-embedding |
| 向量库 / 数据库 | Supabase (PostgreSQL + pgvector) |
| 文件存储 | Supabase Storage |
| 认证 | 账号名 + 密码（bcrypt + JWT，无注册无短信） |
| 部署 | Vercel |

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local` 并填入真实值：

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
  → Supabase Dashboard → Settings → API
- `DEEPSEEK_API_KEY` → platform.deepseek.com → API Keys
- `JWT_SECRET` → 任意 64 位随机字符串

### 3. 初始化数据库

在 Supabase Dashboard → SQL Editor 中执行 `supabase-schema.sql`。

### 4. 创建测试账号

编辑 `scripts/seed-accounts.ts` 中的 `ACCOUNTS` 数组，然后：

```bash
npm run seed:accounts
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 目录结构

```
app/
  (auth)/login/          01 登录页（账号名 + 密码）
  (app)/home/            02 首页 / Agent 入口
  (app)/scan/[id]/       03 审核中（流式动效）
  (app)/report/[id]/     04 体检报告
       .../risk/[rid]/   05 风险详情
  (app)/history/         06 历史记录
  (app)/profile/         07 个人中心
  api/auth/              登录 / 登出
  api/contract/          上传 / 意图 / 验证 / 扫描
lib/                     supabase / auth / deepseek / rag / scoring
components/              scan / report / common UI 组件
scripts/                 seed-accounts / seed-rag
types/                   TypeScript 类型定义
```

## 开发进度

- [x] 01 项目脚手架 & 数据库
- [ ] 02 登录系统（账号名 + 密码）
- [ ] 03 文件上传 & 合同解析
- [ ] 04 Agent 双重拦截（意图识别 + 类型验证）
- [ ] 05 RAG 知识库
- [ ] 06 合同扫描 + 流式输出
- [ ] 07 体检报告 & 风险详情
- [ ] 08 历史 & 个人中心 & 部署
