# AI 圆桌讨论系统 (AI Roundtable)

🎙️ 多个 AI 角色围坐圆桌，轮流发表观点，针对你的话题展开真实、深度的多轮讨论。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-purple)

## 功能特性

- ✅ 角色选择（3-6人）：投资人、工程师、用户、律师、环保人士、经济学家
- ✅ 自定义话题 + 预设话题快速开始
- ✅ 多轮讨论（2-4轮可选）
- ✅ 实时流式输出，逐字展示
- ✅ 完整讨论记录 + 总结报告
- ✅ 纯前端 + Serverless API，完全免费部署

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo>
cd ai-roundtable
```

### 2. 获取 API Key

1. 访问 [OpenRouter](https://openrouter.ai/) 注册账号
2. 新用户自动获得免费 credits
3. 在 Dashboard → Keys 创建 API Key

### 3. 本地运行

```bash
cp .env.example .env.local
# 编辑 .env.local，填入你的 API Key

npm install
npm run dev
```

访问 http://localhost:3000

### 4. 部署到 Vercel（免费）

```bash
npm i -g vercel
vercel login
vercel

# 设置环境变量
vercel env add OPENROUTER_API_KEY
vercel deploy --prod
```

或在 Vercel Dashboard 中：
1. Import this repo
2. Add Environment Variable: `OPENROUTER_API_KEY` = 你的 key
3. Deploy

## 技术架构

```
├── app/
│   ├── page.tsx          # 首页 - 角色选择
│   ├── setup/page.tsx    # 设置页 - 话题输入
│   ├── room/page.tsx     # 讨论室 - 流式输出
│   ├── results/page.tsx  # 结果页 - 总结报告
│   └── api/discuss/      # Serverless API
│       └── route.ts      # LLM 调用 + SSE 流
├── vercel.json           # Vercel 部署配置
└── .env.example          # 环境变量模板
```

## API

### POST /api/discuss

```json
{
  "roles": ["investor", "engineer", "user"],
  "topic": "AI 是否会取代白领工作？",
  "goal": "得出有价值的结论",
  "rounds": 3
}
```

返回：SSE 流式响应，每条消息为 JSON Lines 格式。

## 免费额度说明

| 服务 | 免费额度 |
|------|---------|
| OpenRouter (Gemini Flash) | 1500 req/day，$5 credits新人 |
| Vercel (Hobby) | 100GB bandwidth，Serverless Functions |

## License

MIT
