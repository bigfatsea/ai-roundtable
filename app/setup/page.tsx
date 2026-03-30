"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ROLE_META = [
  { id: "investor", name: "风险投资人", icon: "💼", color: "#f59e0b" },
  { id: "engineer", name: "工程师", icon: "⚙️", color: "#06b6d4" },
  { id: "user", name: "普通用户", icon: "👤", color: "#10b981" },
  { id: "lawyer", name: "法律顾问", icon: "⚖️", color: "#8b5cf6" },
  { id: "env", name: "环保人士", icon: "🌿", color: "#22c55e" },
  { id: "economist", name: "经济学家", icon: "📊", color: "#ef4444" },
];

const PRESET_TOPICS = [
  "AI 是否会在 5 年内取代大部分白领工作？",
  "电动汽车是否真的比燃油车更环保？",
  "远程办公是否应该成为永久性常态？",
  "社交媒体对青少年的心理健康影响",
  "是否应该暂停高级 AI 研发 6 个月？",
  "数据隐私 vs. 安全便利，如何平衡？",
];

export default function SetupPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [rounds, setRounds] = useState(3);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rolesParam = params.get("roles");
    if (rolesParam) {
      try {
        setRoles(JSON.parse(decodeURIComponent(rolesParam)));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const selectedMeta = ROLE_META.filter((r) => roles.includes(r.id));

  const handleStart = () => {
    if (!topic.trim()) return;
    const state = {
      roles,
      topic: topic.trim(),
      goal: goal.trim() || "深入讨论，达成共识",
      rounds,
    };
    const encoded = encodeURIComponent(JSON.stringify(state));
    router.push(`/room?state=${encoded}`);
  };

  if (roles.length === 0) return null;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Back button */}
      <div className="w-full max-w-2xl mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm transition-colors cursor-pointer"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
        >
          ← 返回角色选择
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-10 fade-in-up">
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: 'var(--text)' }}>
          设置<span style={{ color: 'var(--accent)' }}> 讨论话题</span>
        </h1>
        <p className="text-base" style={{ color: 'var(--muted)' }}>
          告诉圆桌你想讨论什么
        </p>
      </div>

      {/* Role badges */}
      <div className="flex flex-wrap gap-2 mb-10 justify-center">
        {selectedMeta.map((role, i) => (
          <div key={role.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
            style={{ background: 'rgba(19,19,31,0.8)', border: '1px solid var(--border)' }}>
            <span>{role.icon}</span>
            <span style={{ color: role.color }}>{role.name}</span>
            {i < selectedMeta.length - 1 && <span style={{ color: 'var(--muted)' }} className="ml-1">·</span>}
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl space-y-6">

        {/* Topic Input */}
        <div className="fade-in-up">
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
            讨论主题 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：AI 是否会在 5 年内取代大部分白领工作？"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
            style={{
              background: 'rgba(19,19,31,0.8)',
              border: '1.5px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Preset Topics */}
        <div className="fade-in-up">
          <label className="block text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>
            或选择一个预设话题
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                style={{
                  background: topic === t ? 'rgba(108,92,231,0.2)' : 'rgba(19,19,31,0.6)',
                  border: `1px solid ${topic === t ? 'rgba(108,92,231,0.5)' : 'var(--border)'}`,
                  color: topic === t ? 'var(--accent2)' : 'var(--muted)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Goal Input */}
        <div className="fade-in-up">
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
            讨论目标（可选）
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例如：得出一个可执行的建议 / 全面分析利弊"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(19,19,31,0.8)',
              border: '1.5px solid var(--border)',
              color: 'var(--text)',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Rounds */}
        <div className="fade-in-up">
          <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
            讨论轮数：<span style={{ color: 'var(--accent2)' }}>{rounds} 轮</span>
          </label>
          <div className="flex gap-3">
            {[2, 3, 4].map((r) => (
              <button
                key={r}
                onClick={() => setRounds(r)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: rounds === r ? 'rgba(108,92,231,0.2)' : 'rgba(19,19,31,0.6)',
                  border: `1.5px solid ${rounds === r ? 'var(--accent)' : 'var(--border)'}`,
                  color: rounds === r ? 'var(--accent2)' : 'var(--muted)',
                }}
              >
                {r} 轮
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4 fade-in-up">
          <button
            onClick={handleStart}
            disabled={!topic.trim()}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: topic.trim() ? 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)' : 'var(--border)',
              color: '#fff',
              boxShadow: topic.trim() ? '0 0 40px rgba(108,92,231,0.3)' : 'none',
            }}
          >
            🎙️ 进入圆桌，开始讨论
          </button>
        </div>
      </div>
    </main>
  );
}
