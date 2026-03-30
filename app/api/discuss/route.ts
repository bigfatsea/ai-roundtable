import { NextRequest, NextResponse } from "next/server";

const ROLE_META: Record<string, {
  name: string;
  persona: string;
}> = {
  investor: {
    name: "风险投资人",
    persona: "你是一位经验丰富的风险投资人，专注早期科技创业项目。你关注商业模式、市场规模、竞争壁垒、退出机制。表达简洁有力，喜欢引用数据。",
  },
  engineer: {
    name: "工程师",
    persona: "你是一位资深全栈工程师，曾在Google、Meta等公司任职。你关注技术实现、系统架构、技术风险和工程成本。严谨务实，从技术细节出发。",
  },
  user: {
    name: "普通用户",
    persona: "你是一位普通消费者，是产品最终用户。你关注实际体验、价格、隐私安全、易用性。说话直接朴实，代表大众真实声音。",
  },
  lawyer: {
    name: "法律顾问",
    persona: "你是一位专注科技领域的律师，处理过大量AI、数据合规案件。你关注知识产权、隐私法规、合规风险。条理清晰，引用法规。",
  },
  env: {
    name: "环保人士",
    persona: "你是一位环保活动家，专注科技对环境的影响。你关注碳排放、能源消耗、电子废弃物。可持续发展视角，富有激情。",
  },
  economist: {
    name: "经济学家",
    persona: "你是一位宏观经济学家，在央行和智库有工作经历。你从宏观经济趋势、政策影响、市场规律角度分析。有深度，引用经济理论。",
  },
};

function buildPrompt(roles: string[], topic: string, goal: string, rounds: number) {
  const roleDetails = roles
    .map((r) => {
      const m = ROLE_META[r];
      return m ? `- ${m.name}：${m.persona}` : null;
    })
    .filter(Boolean)
    .join("\n");

  return `【AI圆桌讨论】

参与者：
${roleDetails}

讨论话题："${topic}"
目标：${goal}

请生成${rounds}轮圆桌讨论。

**重要格式要求（必须严格遵守）：**
请用以下JSON Lines格式输出，每行一个完整的JSON对象，不要输出任何其他文字：
{"type":"round_start","round":1}
{"type":"speaker","speaker":"风险投资人"}
{"type":"text","content":"发言内容..."}
{"type":"message_end","speaker":"风险投资人","full_content":"完整发言..."}
{"type":"speaker","speaker":"工程师"}
{"type":"text","content":"发言内容..."}
{"type":"message_end","speaker":"工程师","full_content":"完整发言..."}
...（按顺序，每个角色发言一次为一轮）...
{"type":"round_start","round":2}
...（继续第2轮）...
{"type":"round_start","round":3}
...（如果有第3轮）...
{"type":"done"}

要求：
1. 共${rounds}轮，每个角色每轮发言1次
2. 后续轮次要回应前面的观点
3. 最后一轮要有总结
4. 发言要有深度和真实交锋
5. message_end的full_content要和该角色的所有text累加一致
6. 只输出JSON Lines，不要任何其他文字说明

开始：`;
}

export async function POST(req: NextRequest) {
  try {
    const { roles, topic, goal, rounds } = await req.json();

    if (!roles || !Array.isArray(roles) || roles.length < 3 || roles.length > 6) {
      return NextResponse.json({ error: "需要3-6个角色" }, { status: 400 });
    }
    if (!topic?.trim()) {
      return NextResponse.json({ error: "话题不能为空" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key 未配置。请设置 OPENROUTER_API_KEY 环境变量。" },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(roles, topic.trim(), goal?.trim() || "深入讨论，得出有价值的结论", rounds || 3);

    // Non-streaming request to get full response
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-roundtable.vercel.app",
        "X-Title": "AI 圆桌讨论",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-thinking-exp-01-21",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter error:", errText);
      return NextResponse.json(
        { error: `OpenRouter API 错误: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Stream the response as SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the raw content as a single event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "raw", content: rawContent })}\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
