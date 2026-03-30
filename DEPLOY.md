# AI 圆桌讨论系统 — 部署指南

## 🚀 快速部署到 Vercel（推荐，5分钟）

### 步骤 1：获取 OpenRouter API Key
1. 访问 https://openrouter.ai/ 注册账号
2. 新用户自动获得免费 credits
3. Dashboard → Keys → Create Key

### 步骤 2：部署到 Vercel
**方式 A：网页部署（最简单）**
1. 访问 https://vercel.com/new
2. Import GitHub repo: `bigfatsea/ai-roundtable`
3. Add Environment Variable:
   - Key: `OPENROUTER_API_KEY`
   - Value: 你的 OpenRouter API Key
4. 点击 Deploy

**方式 B：CLI 部署**
```bash
npm i -g vercel
vercel login
cd ai-roundtable
vercel
# 添加环境变量：
vercel env add OPENROUTER_API_KEY
vercel deploy --prod
```

### 步骤 3：配置环境变量
在 Vercel Dashboard → Settings → Environment Variables 添加：
```
OPENROUTER_API_KEY = sk-or-v1-xxxxxxxxxxxxx
```

---

## 🌧️ 部署到 Cloudflare Pages（免费额度更大）

```bash
npm install -g wrangler
wrangler login  # 浏览器授权
cd ai-roundtable

# 构建
npm run build

# 部署
wrangler pages deploy .next --project-name=ai-roundtable
```

---

## ✅ 验证部署

部署完成后访问你的 Vercel/Cloudflare URL，测试流程：
1. 选择 3-4 个角色
2. 输入话题或选择预设话题
3. 点击开始讨论
4. 观看 AI 角色们轮流发言
5. 查看总结报告

---

## 🔧 本地运行

```bash
cd ai-roundtable
cp .env.example .env.local
# 编辑 .env.local，填入 OPENROUTER_API_KEY

npm install
npm run dev
# 访问 http://localhost:3000
```

---

## 📁 项目结构

```
ai-roundtable/
├── app/
│   ├── page.tsx          # 首页 - 角色选择（3-6人）
│   ├── setup/page.tsx   # 话题输入 + 轮数设置
│   ├── room/page.tsx    # 实时讨论 - 流式输出
│   ├── results/page.tsx # 总结报告 + 全文记录
│   └── api/discuss/     # Serverless API
├── vercel.json           # Vercel 配置
├── .env.example          # 环境变量模板
└── README.md
```

---

## 💡 免费额度

| 平台 | 免费额度 |
|------|---------|
| OpenRouter (Gemini Flash) | 1500 req/day，新用户 $5 credits |
| Vercel (Hobby) | 100GB bandwidth，Serverless Functions |
| Cloudflare Pages | 500 builds/month，unlimited bandwidth |

---

## ❓ 常见问题

**Q: 报 OPENROUTER_API_KEY 错误？**
A: 确保在 Vercel/Cloudflare 的环境变量设置中添加了 `OPENROUTER_API_KEY`

**Q: 流式输出不工作？**
A: 检查 API 路由是否正常，Vercel Edge Functions 需要 `export const runtime = "edge"`

**Q: 讨论内容不满意？**
A: 可在 setup 页面调整轮数（2-4轮），或修改 API 路由中的 prompt
