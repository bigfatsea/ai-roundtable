"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  {
    id: "investor",
    name: "风险投资人",
    icon: "💼",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.3)",
    description: "关注商业模式、增长潜力与退出机制",
  },
  {
    id: "engineer",
    name: "工程师",
    icon: "⚙️",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
    border: "rgba(6,182,212,0.3)",
    description: "关注技术可行性、系统架构与实现细节",
  },
  {
    id: "user",
    name: "普通用户",
    icon: "👤",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.3)",
    description: "关注实际体验、易用性与性价比",
  },
  {
    id: "lawyer",
    name: "法律顾问",
    icon: "⚖️",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.3)",
    description: "关注合规风险、知识产权与合同条款",
  },
  {
    id: "env",
    name: "环保人士",
    icon: "🌿",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.3)",
    description: "关注环境影响、可持续性与社会责任",
  },
  {
    id: "economist",
    name: "经济学家",
    icon: "📊",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
    description: "关注宏观经济影响、市场趋势与政策",
  },
];

export default function HomePage() {
  const [selected, setSelected] = useState<string[]>(["investor", "engineer", "user"]);
  const router = useRouter();

  const toggleRole = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length <= 3) return; // minimum 3 roles
      setSelected(selected.filter((r) => r !== id));
    } else {
      if (selected.length >= 6) return; // maximum 6 roles
      setSelected([...selected, id]);
    }
  };

  const handleStart = () => {
    const encoded = encodeURIComponent(JSON.stringify(selected));
    router.push(`/setup?roles=${encoded}`);
  };

  const selectedRoles = ROLES.filter((r) => selected.includes(r.id));

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12 fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
          style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)', color: '#a29bfe' }}>
          <span className="float" style={{ animationDelay: '0s' }}>✨</span>
          AI 驱动的多角色圆桌讨论
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 glow-text" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
          AI 圆桌<span style={{ color: 'var(--accent)' }}>讨论</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
          选择不同背景的 AI 角色，让它们围坐圆桌，针对你的话题展开真实、深度的多轮讨论
        </p>
      </div>

      {/* Role Grid */}
      <div className="w-full max-w-4xl mb-10">
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            选择参与角色（3-6人）
          </span>
          <span className="text-xs px-3 py-1 rounded-full" style={{
            background: selected.length < 3 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            color: selected.length < 3 ? '#ef4444' : '#10b981',
            border: `1px solid ${selected.length < 3 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`
          }}>
            {selected.length} / 6 已选
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 stagger">
          {ROLES.map((role) => {
            const isSelected = selected.includes(role.id);
            return (
              <button
                key={role.id}
                onClick={() => toggleRole(role.id)}
                className="relative p-4 rounded-2xl text-left transition-all duration-300 cursor-pointer"
                style={{
                  background: isSelected ? role.bg : 'rgba(19,19,31,0.6)',
                  border: `1.5px solid ${isSelected ? role.border : 'var(--border)'}`,
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? `0 0 20px ${role.border}` : 'none',
                }}
              >
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: role.color, color: '#0a0a0f' }}
                  >
                    ✓
                  </div>
                )}
                <div className="text-3xl mb-2">{role.icon}</div>
                <div className="font-semibold text-sm mb-1" style={{ color: isSelected ? role.color : 'var(--text)' }}>
                  {role.name}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {role.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Summary */}
      {selectedRoles.length >= 3 && (
        <div className="w-full max-w-4xl mb-8 p-5 rounded-2xl fade-in-up"
          style={{ background: 'rgba(108,92,231,0.08)', border: '1px solid rgba(108,92,231,0.2)' }}>
          <div className="text-xs font-medium mb-3" style={{ color: 'var(--accent2)' }}>
            圆桌阵容
          </div>
          <div className="flex flex-wrap gap-3">
            {selectedRoles.map((role, i) => (
              <div key={role.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{ background: role.bg, border: `1px solid ${role.border}` }}>
                <span>{role.icon}</span>
                <span style={{ color: role.color }}>{role.name}</span>
                {i < selectedRoles.length - 1 && (
                  <span style={{ color: 'var(--muted)' }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={handleStart}
        disabled={selected.length < 3}
        className="relative px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
          color: '#fff',
          boxShadow: selected.length >= 3 ? '0 0 40px rgba(108,92,231,0.4)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (selected.length >= 3) {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 60px rgba(108,92,231,0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = selected.length >= 3 ? '0 0 40px rgba(108,92,231,0.4)' : 'none';
        }}
      >
        {selected.length < 3 ? `还需选择 ${3 - selected.length} 个角色` : '🚀 开始设置话题'}
      </button>

      {/* Footer */}
      <div className="mt-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
        使用 OpenRouter + Free LLM · 纯前端 + Serverless · 完全免费部署
      </div>
    </main>
  );
}
