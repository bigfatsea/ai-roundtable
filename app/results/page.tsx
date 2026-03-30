"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ROLE_COLORS: Record<string, { color: string; icon: string; bg: string }> = {
  风险投资人: { color: "#f59e0b", icon: "💼", bg: "rgba(245,158,11,0.1)" },
  工程师: { color: "#06b6d4", icon: "⚙️", bg: "rgba(6,182,212,0.1)" },
  普通用户: { color: "#10b981", icon: "👤", bg: "rgba(16,185,129,0.1)" },
  法律顾问: { color: "#8b5cf6", icon: "⚖️", bg: "rgba(139,92,246,0.1)" },
  环保人士: { color: "#22c55e", icon: "🌿", bg: "rgba(34,197,94,0.1)" },
  经济学家: { color: "#ef4444", icon: "📊", bg: "rgba(239,68,68,0.1)" },
};

interface Message {
  speaker: string;
  content: string;
  round?: number;
}

interface ResultState {
  roles: string[];
  topic: string;
  goal: string;
  rounds: number;
  messages: Message[];
}

function SummaryCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl fade-in-up"
      style={{ background: 'rgba(19,19,31,0.8)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DiscussionTranscript({ messages }: { messages: Message[] }) {
  const grouped: Record<number, Message[]> = {};
  messages.forEach((m) => {
    const r = m.round || 1;
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(m);
  });

  return (
    <div>
      {Object.entries(grouped).map(([round, msgs]) => (
        <div key={round} className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--accent2)', border: '1px solid rgba(108,92,231,0.2)' }}>
              第 {round} 轮
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          <div className="space-y-4">
            {msgs.map((msg, i) => {
              const meta = ROLE_COLORS[msg.speaker] || { color: "#6c5ce7", icon: "🎤", bg: "rgba(108,92,231,0.1)" };
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base"
                    style={{ background: meta.bg }}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-xs" style={{ color: meta.color }}>{msg.speaker}</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl text-sm leading-relaxed"
                      style={{ background: 'rgba(10,10,15,0.6)', border: '1px solid var(--border)', color: 'var(--text)', borderTopLeftRadius: '2px' }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function generateSummary(messages: Message[]): { consensus: string; insights: string[]; keyPoints: string[] } {
  // Extract key insights from messages
  const allContent = messages.map(m => `${m.speaker}：${m.content}`).join("\n");

  const insights: string[] = [];
  const keyPoints: string[] = [];
  let consensus = "各角色从不同角度展开了深入讨论，观点各有侧重，详见下方全文记录。";

  // Simple keyword-based extraction
  const msgTexts = messages.map(m => m.content);

  // Extract unique viewpoints
  const speakers = [...new Set(messages.map(m => m.speaker))];

  if (speakers.length > 0) {
    consensus = `${speakers.join("、")} 等角色从不同视角对议题展开了讨论，详见下方全文记录。`;
  }

  // Try to extract a conclusion from the last message
  const lastMsg = messages[messages.length - 1];
  if (lastMsg && (lastMsg.content.includes("总结") || lastMsg.content.includes("结论") || lastMsg.content.includes("共识"))) {
    const sentences = lastMsg.content.split(/[。！？]/).filter(Boolean);
    const conclusion = sentences.find(s => s.length > 20 && (s.includes("总结") || s.includes("结论") || s.includes("建议") || s.includes("共识")));
    if (conclusion) consensus = conclusion.trim();
  }

  // Collect unique viewpoints
  speakers.forEach(speaker => {
    const speakerMsgs = messages.filter(m => m.speaker === speaker);
    if (speakerMsgs.length > 0) {
      const firstContent = speakerMsgs[0].content;
      const short = firstContent.substring(0, 100).replace(/\n/g, ' ');
      if (short.length > 0) {
        insights.push(`【${speaker}】${short}...`);
      }
    }
  });

  return { consensus, insights, keyPoints };
}

export default function ResultsPage() {
  const router = useRouter();
  const [state, setState] = useState<ResultState | null>(null);
  const [summary, setSummary] = useState<{ consensus: string; insights: string[]; keyPoints: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "transcript">("summary");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state");
    if (stateParam) {
      try {
        const s = JSON.parse(decodeURIComponent(stateParam)) as ResultState;
        setState(s);
        setSummary(generateSummary(s.messages));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  if (!state || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const { consensus, insights } = summary;
  const rounds = Math.max(...state.messages.map(m => m.round || 1));

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="glass sticky top-0 z-20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>讨论结果</div>
            <h1 className="font-bold text-sm truncate max-w-md" style={{ color: 'var(--text)' }}>
              {state.topic}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--accent2)', border: '1px solid rgba(108,92,231,0.3)' }}>
              {state.messages.length} 条发言 · {rounds} 轮
            </div>
            <button onClick={() => router.push("/")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              style={{ background: 'rgba(19,19,31,0.8)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              🏠 新讨论
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Topic Hero */}
        <div className="text-center mb-10 fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)', color: 'var(--accent2)' }}>
            📋 讨论报告
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {state.topic}
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {state.roles.map((r) => {
              const meta = ROLE_COLORS[Object.keys(ROLE_COLORS).find(k => k.includes(r)) || ""] ||
                { color: "#6c5ce7", icon: "🎤", bg: "rgba(108,92,231,0.1)" };
              return (
                <div key={r} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                  style={{ background: meta.bg, color: meta.color }}>
                  <span>{meta.icon}</span>
                  <span>{r}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-8 inline-flex"
          style={{ background: 'rgba(19,19,31,0.8)', border: '1px solid var(--border)' }}>
          {(["summary", "transcript"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style={{
                background: activeTab === tab ? 'var(--accent)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--muted)',
              }}>
              {tab === "summary" ? "📊 总结报告" : "📝 完整记录"}
            </button>
          ))}
        </div>

        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            {/* Consensus */}
            <div className="p-6 rounded-2xl fade-in-up"
              style={{ background: 'linear-gradient(135deg, rgba(108,92,231,0.15) 0%, rgba(162,155,254,0.08) 100%)', border: '1px solid rgba(108,92,231,0.25)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-base" style={{ color: 'var(--accent2)' }}>核心结论</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                {consensus}
              </p>
            </div>

            {/* Per-speaker insights */}
            <SummaryCard title="各方观点" icon="💬">
              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <div key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                    {insight}
                  </div>
                ))}
              </div>
            </SummaryCard>

            {/* Discussion stats */}
            <SummaryCard title="讨论统计" icon="📈">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(10,10,15,0.4)', border: '1px solid var(--border)' }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent2)' }}>{state.messages.length}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>总发言数</div>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(10,10,15,0.4)', border: '1px solid var(--border)' }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent2)' }}>{rounds}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>讨论轮次</div>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(10,10,15,0.4)', border: '1px solid var(--border)' }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent2)' }}>{state.roles.length}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>参与角色</div>
                </div>
              </div>
            </SummaryCard>
          </div>
        )}

        {/* Transcript Tab */}
        {activeTab === "transcript" && (
          <div className="fade-in-up">
            <DiscussionTranscript messages={state.messages} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={() => router.push("/")}
            className="flex-1 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all"
            style={{ background: 'rgba(19,19,31,0.8)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            🏠 发起新讨论
          </button>
          <button
            onClick={() => {
              const text = `【AI圆桌讨论】\n\n主题：${state.topic}\n\n${state.messages.map(m => `[${m.speaker}] ${m.content}`).join("\n\n")}`;
              navigator.clipboard.writeText(text).catch(() => {});
            }}
            className="flex-1 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all"
            style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)', color: 'var(--accent2)' }}>
            📋 复制报告
          </button>
        </div>
      </main>
    </div>
  );
}
