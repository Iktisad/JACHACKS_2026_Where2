import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, MessageSquare } from 'lucide-react';
import { getThreadMessages, type BackboardMessage } from '../services/backboard';

function formatTime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export function BackboardLog() {
  const [messages, setMessages] = useState<BackboardMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const msgs = await getThreadMessages();
    setMessages(msgs);
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="pb-10" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="relative text-white overflow-hidden" style={{ background: 'var(--hero)' }}>
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute right-8 top-10 w-24 h-24 rounded-full border border-white/5 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-10">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                  <Sparkles className="w-4 h-4 text-white" strokeWidth={1.8} />
                </div>
                <div>
                  <h1 className="text-[22px] font-semibold tracking-tight">AI Memory Log</h1>
                  <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                    Powered by Backboard.io
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => load(true)}
                disabled={refreshing}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.8} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-3">
        {/* What is this card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-4"
          style={{ background: 'color-mix(in srgb, var(--primary) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--primary) 18%, transparent)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'color-mix(in srgb, var(--primary) 60%, transparent)' }}>
            How it works
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--foreground)' }}>
            Every login, session, and preference change is stored as a memory fact in
            Backboard.io's persistent thread. Gemini reads these facts to generate the
            personalised nudges shown on the Leaderboard and after each study session.
          </p>
        </motion.div>

        {/* Message thread */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--muted) 40%, transparent)' }}>
            <MessageSquare className="w-4 h-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>Thread</span>
            {!loading && (
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
                {messages.filter((m) => m.role === 'user').length} facts stored
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 rounded-full shrink-0" style={{ background: 'var(--muted)' }} />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 rounded w-1/4" style={{ background: 'var(--muted)' }} />
                    <div className="h-3 rounded w-full" style={{ background: 'var(--muted)' }} />
                    <div className="h-3 rounded w-4/5" style={{ background: 'var(--muted)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 40%, transparent)' }} strokeWidth={1.5} />
              <p className="text-[14px] font-medium" style={{ color: 'var(--muted-foreground)' }}>No activity logged yet</p>
              <p className="text-[12px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 60%, transparent)' }}>
                Log in, start a session, or change preferences to see entries
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {/* Show only user-sent facts (role=user, status=COMPLETED) */}
              {messages.filter((m) => m.role === 'user').map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex gap-3 px-4 py-3.5"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
                        Memory stored
                      </span>
                      {msg.created_at && (
                        <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                          {formatTime(msg.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--foreground)' }}>
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Powered-by badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 py-2"
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} strokeWidth={1.8} />
          <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
            Persistent memory powered by <span className="font-semibold">Backboard.io</span>
          </span>
        </motion.div>
      </div>
    </div>
  );
}
