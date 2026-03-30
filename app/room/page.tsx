"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const ROLE_META: Record<string, { name: string; icon: string; color: string; bg: string; border: string }> = {
  investor: { name: "风险投资人", icon: "💼", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  engineer: { name: "工程师", icon: "⚙️", color: "#06b6d4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.3)" },
  user: { name: "普通用户", icon: "👤", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
  lawyer: { name: "法律顾问", icon: "⚖️", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.3)" },
  env: { name: "环保人士", icon: "🌿", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" },
  economist: { name: "经济学家", icon: "📊", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
};

interface Message {
  id: string;
  speaker: string;
  speakerIcon: string;
  speakerColor: string;
  speakerBg: string;
  content: string;
  round: number;
}

interface RoomState {
  roles: string[];
  topic: string;
  goal: string;
  rounds: number;
}

type Phase = "loading" | "discussing" | "done";

export default function RoomPage() {
  const router = useRouter();
  const [state, setState] = useState<RoomState | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state");
    if (stateParam) {
      try {
        setState(JSON.parse(decodeURIComponent(stateParam)));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const parseAndStream = useCallback((rawContent: string) => {
    // Parse JSON lines from LLM response
    const lines = rawContent.split("\n").filter(l => l.trim());
    const parsed: any[] = [];

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.type && obj.type !== "raw") {
          parsed.push(obj);
        }
      } catch {
        // Skip malformed lines
      }
    }

    // Now stream through parsed events with animation delay
    let msgId = 0;
    let currentSpeaker = "";
    let currentText = "";
    let currentRound = 1;
    let speakerBuffer = "";

    const streamEvent = (event: any, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          if (event.type === "round_start") {
            currentRound = event.round;
            setCurrentRound(event.round);
          } else if (event.type === "speaker") {
            currentSpeaker = event.speaker;
            speakerBuffer = "";
          } else if (event.type === "text") {
            currentText += event.content;
            speakerBuffer += event.content;
            // Update last message with streaming content
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === currentSpeaker && last.content !== speakerBuffer) {
                return [...prev.slice(0, -1), { ...last, content: speakerBuffer }];
              }
              return prev;
            });
          } else if (event.type === "message_end") {
            const speakerKey = Object.keys(ROLE_META).find(k => ROLE_META[k].name === event.speaker) || "";
            const meta = ROLE_META[speakerKey] || { name: event.speaker, icon: "🎤", color: "#6c5ce7", bg: "rgba(108,92,231,0.1)", border: "rgba(108,92,231,0.3)" };
            setMessages(prev => [
              ...prev.filter(m => !(m.speaker === currentSpeaker && m.id.startsWith("streaming"))),
              {
                id: `msg-${msgId++}`,
                speaker: meta.name,
                speakerIcon: meta.icon,
                speakerColor: meta.color,
                speakerBg: meta.bg,
                content: event.full_content || currentText,
                round: currentRound,
              },
            ]);
            currentText = "";
            speakerBuffer = "";
          } else if (event.type === "done") {
            setPhase("done");
          }
          setProgress(prev => Math.min(prev + 1, 100));
          resolve();
        }, delay);
      });
    };

    // Add a "thinking" message initially
    setPhase("discussing");

    // Process events with delays for animation effect
    (async () => {
      for (const event of parsed) {
        if (abortRef.current?.signal.aborted) break;
        await streamEvent(event, 80);
        scrollToBottom();
      }
      if (!abortRef.current?.signal.aborted) {
        setPhase("done");
      }
    })();
  }, [scrollToBottom]);

  useEffect(() => {
    if (!state) return;
    setPhase("loading");

    abortRef.current = new AbortController();

    fetch("/api/discuss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roles: state.roles,
        topic: state.topic,
        goal: state.goal,
        rounds: state.rounds,
      }),
      signal: abortRef.current.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]" || trimmed === "[DONE]") continue;

            let dataStr = trimmed;
            if (dataStr.startsWith("data: ")) dataStr = dataStr.slice(6);

            try {
              const event = JSON.parse(dataStr);
              if (event.type === "raw" && event.content) {
                parseAndStream(event.content);
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (e: any) {
              if (e.message) throw e;
            }
          }
        }
      })
      .catch((err: any) => {
        if (err.name === "AbortError") {
          setPhase("done");
        } else {
          setError(err.message || "讨论出错，请重试");
          setPhase("done");
        }
      });
  }, [state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const stopDiscussion = () => {
    abortRef.current?.abort();
    setPhase("done");
  };

  const goToResults = () => {
    if (!state) return;
    const resultState = {
      ...state,
      messages: messages.map((m) => ({
        speaker: m.speaker,
        content: m.content,
        round: m.round,
      })),
    };
    router.push(`/results?state=${encodeURIComponent(JSON.stringify(resultState))}`);
  };

  const restart = () => {
    setMessages([]);
    setError(null);
    setPhase("loading");
    setProgress(0);
    if (state) {
      const s = state;
      abortRef.current = new AbortController();
      setState(null);
      setTimeout(() => setState(s), 50);
    }
  };

  if (!state) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="glass sticky top-0 z-20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-4">
            <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>圆桌讨论</div>
            <h1 className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
              {state.topic}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {phase === "discussing" && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--accent2)', border: '1px solid rgba(108,92,231,0.3)' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                  第 {currentRound} / {state.rounds} 轮
                </div>
                <button onClick={stopDiscussion}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  ⏹ 停止
                </button>
              </>
            )}
            {phase === "done" && (
              <button onClick={goToResults}
                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff', boxShadow: '0 0 20px rgba(108,92,231,0.3)' }}>
                📋 查看总结 →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Loading */}
          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                <div className="absolute inset-3 rounded-full border-2 border-b-transparent animate-spin" style={{ borderColor: 'var(--accent2)', borderBottomColor: 'transparent', animationDirection: 'reverse', animationDuration: '2s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl">🎙️</span>
                </div>
              </div>
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text)' }}>正在召集各位角色...</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                AI 正在生成 {state.roles.length} 位角色的 {state.rounds} 轮讨论
              </p>
              {/* Role avatars */}
              <div className="flex gap-3 mt-6">
                {state.roles.map((r) => {
                  const meta = ROLE_META[r];
                  return meta ? (
                    <div key={r} className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                      {meta.icon}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => {
            const prev = messages[idx - 1];
            const showDivider = !prev || prev.round !== msg.round;
            return (
              <div key={msg.id}>
                {showDivider && (
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--accent2)', border: '1px solid rgba(108,92,231,0.2)' }}>
                      第 {msg.round} 轮
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                )}
                <div className="flex gap-3 mb-1 fade-in-up">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: msg.speakerBg }}>
                    {msg.speakerIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-sm" style={{ color: msg.speakerColor }}>
                        {msg.speaker}
                      </span>
                    </div>
                    <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: 'rgba(19,19,31,0.8)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        borderTopLeftRadius: '4px',
                      }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Done state */}
          {phase === "done" && !error && messages.length > 0 && (
            <div className="flex flex-col items-center gap-4 py-8 fade-in-up">
              <div className="text-4xl">🎉</div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>讨论已结束</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                共 {messages.length} 条发言 · {state.rounds} 轮讨论
              </p>
              <div className="flex gap-3 mt-2">
                <button onClick={restart}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
                  style={{ background: 'rgba(19,19,31,0.8)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  🔄 重新讨论
                </button>
                <button onClick={goToResults}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff', boxShadow: '0 0 20px rgba(108,92,231,0.3)' }}>
                  📋 查看总结报告 →
                </button>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
