import { useState } from 'react';
import { Trophy, Medal, Award, Crown, TrendingUp, ChevronDown, ChevronRight, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfileModal } from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';

const MOCK_LEADERBOARD = [
  { rank: 1,  name: 'Emma Wilson',     avatar: 'EW', tokens: 342 },
  { rank: 2,  name: 'Marcus Chen',     avatar: 'MC', tokens: 287 },
  { rank: 3,  name: 'Sofia Rodriguez', avatar: 'SR', tokens: 251 },
  { rank: 4,  name: 'Jordan Davis',    avatar: 'JD', tokens: 198 },
  { rank: 5,  name: 'Aisha Patel',     avatar: 'AP', tokens: 176 },
  { rank: 6,  name: "Liam O'Brien",    avatar: 'LO', tokens: 159 },
  { rank: 7,  name: 'Maya Thompson',   avatar: 'MT', tokens: 143 },
  { rank: 8,  name: 'Carlos Mendez',   avatar: 'CM', tokens: 128 },
  { rank: 9,  name: 'Zara Khan',       avatar: 'ZK', tokens: 114 },
  { rank: 10, name: 'Noah Anderson',   avatar: 'NA', tokens: 97  },
];

const PERIODS = ['This Week', 'This Month', 'All Time'];

const AVATAR_BG = [
  'bg-[#164863]', 'bg-[#427D9D]', 'bg-[#2a6a8a]', 'bg-[#1a5578]',
  'bg-[#3a7090]', 'bg-[#0e3249]', 'bg-[#4a8aad]', 'bg-[#2d6280]',
  'bg-[#164863]', 'bg-[#427D9D]',
];

type LeaderEntry = typeof MOCK_LEADERBOARD[number] & { isCurrentUser?: boolean };

export function Leaderboard() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<LeaderEntry | null>(null);
  const [activePeriod, setActivePeriod] = useState('This Week');
  const [showAll, setShowAll] = useState(false);

  const leaderboardData: LeaderEntry[] = MOCK_LEADERBOARD.map((entry) => {
    if (user && entry.name === user.name) {
      return { ...entry, avatar: user.avatar, isCurrentUser: true };
    }
    return { ...entry, isCurrentUser: false };
  });

  const userInList = leaderboardData.some((e) => e.isCurrentUser);
  if (user && !userInList) {
    leaderboardData.push({ rank: user.rank ?? 99, name: user.name, avatar: user.avatar, tokens: user.tokens, isCurrentUser: true });
  }

  const top3 = leaderboardData.slice(0, 3);
  const rest = showAll ? leaderboardData.slice(3) : leaderboardData.slice(3, 7);
  const currentUser = leaderboardData.find((u) => u.isCurrentUser);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="pb-10" style={{ background: 'var(--background)' }}>
      <div className="relative text-white overflow-hidden" style={{ background: 'var(--hero)' }}>
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute right-8 top-10 w-24 h-24 rounded-full border border-white/5 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-10">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <Trophy className="w-4 h-4 text-white" strokeWidth={1.8} />
              </div>
              <h1 className="text-[22px] font-semibold tracking-tight">Top Studiers</h1>
            </div>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
              John Abbott College · Compete &amp; earn SOL tokens
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="flex gap-2 mt-5">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setActivePeriod(p)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                style={activePeriod === p
                  ? { background: 'var(--primary-foreground)', color: 'var(--foreground)' }
                  : { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.65)' }
                }
              >
                {p}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          className="rounded-3xl border shadow-xl overflow-hidden mb-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-end justify-center gap-0 px-4 pt-6">
            {podiumOrder.map((entry, vi) => {
              if (!entry) return null;
              const isFirst  = entry.rank === 1;
              const isSecond = entry.rank === 2;
              const isThird  = entry.rank === 3;
              const avatarBg = AVATAR_BG[(entry.rank - 1) % AVATAR_BG.length];
              const colHeight = isFirst ? 'h-44' : isSecond ? 'h-32' : 'h-28';
              const avatarSize = isFirst ? 'w-[72px] h-[72px]' : 'w-14 h-14';
              const mountOffset = isFirst ? '-mt-4' : isSecond ? 'mt-2' : 'mt-4';
              const MedalIcon = isFirst ? Crown : isSecond ? Medal : Award;
              const medalColor = isFirst ? 'text-primary' : isSecond ? 'text-primary/70' : 'text-primary/45';
              const podiumBg = isFirst
                ? 'bg-primary/15 border-t-4 border-primary'
                : isSecond
                ? 'bg-primary/10 border-t-4 border-primary/60'
                : 'bg-primary/6 border-t-4 border-primary/30';

              return (
                <motion.button
                  key={entry.rank}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + vi * 0.07 }}
                  onClick={() => setSelectedUser(entry)}
                  className={`flex flex-col items-center flex-1 cursor-pointer group ${mountOffset}`}
                >
                  <div className="relative mb-2">
                    <div
                      className={`${avatarSize} rounded-full ${avatarBg} flex items-center justify-center text-white font-bold border-2 border-white shadow-md group-hover:scale-105 transition-transform ${isFirst ? 'ring-2 ring-[#9BBEC8]/80 ring-offset-1' : ''}`}
                      style={{ fontSize: isFirst ? '1.15rem' : '0.875rem' }}
                    >
                      {entry.avatar}
                    </div>
                    {isFirst && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--primary)' }}>
                        <Crown className="w-3 h-3" style={{ color: 'var(--primary-foreground)' }} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold mb-1.5 leading-tight truncate max-w-[80px] text-center" style={{ color: 'var(--foreground)' }}>
                    {entry.name.split(' ')[0]}
                    {entry.isCurrentUser && <span className="block text-[10px] font-semibold" style={{ color: 'var(--primary)' }}>(you)</span>}
                  </p>
                  <div className={`w-full ${colHeight} ${podiumBg} rounded-t-xl flex flex-col items-center justify-start pt-3 gap-1`}>
                    <MedalIcon className={`w-4 h-4 ${medalColor}`} strokeWidth={1.8} />
                    <div className={`font-bold tabular-nums ${isFirst ? 'text-[20px]' : 'text-[17px]'}`} style={{ color: 'var(--foreground)' }}>{entry.tokens}</div>
                    <div className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      <Coins className="w-2.5 h-2.5" strokeWidth={1.8} />
                      tokens
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {currentUser && currentUser.rank > 3 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => setSelectedUser(currentUser)}
            className="w-full flex items-center gap-3.5 rounded-2xl px-4 py-3.5 border-2 mb-4 text-left transition-colors"
            style={{ background: 'color-mix(in srgb, var(--primary) 6%, transparent)', borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)' }}
          >
            <div className={`w-11 h-11 rounded-full ${AVATAR_BG[Math.min(currentUser.rank - 1, AVATAR_BG.length - 1)]} flex items-center justify-center text-white font-bold text-[13px] shrink-0`}>
              {currentUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Your rank</p>
              <p className="font-semibold text-[14px] truncate" style={{ color: 'var(--foreground)' }}>{currentUser.name}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[20px] font-bold leading-none" style={{ color: 'var(--primary)' }}>#{currentUser.rank}</div>
              <div className="text-[11px] mt-0.5 flex items-center gap-1 justify-end" style={{ color: 'var(--muted-foreground)' }}>
                <Coins className="w-3 h-3" strokeWidth={1.8} />{currentUser.tokens}
              </div>
            </div>
          </motion.button>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--foreground)' }}>All Rankings</h3>
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>Live</span>
            </div>
          </div>

          <AnimatePresence>
            {rest.map((entry, i) => (
              <motion.button
                key={entry.rank}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.04 }}
                onClick={() => setSelectedUser(entry)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors ${i !== rest.length - 1 ? 'border-b' : ''}`}
                style={{ background: entry.isCurrentUser ? 'color-mix(in srgb, var(--primary) 4%, transparent)' : '', borderColor: 'var(--border)' }}
              >
                <span className="w-6 text-center text-[13px] font-bold tabular-nums shrink-0" style={{ color: 'var(--muted-foreground)' }}>{entry.rank}</span>
                <div className={`w-10 h-10 rounded-full ${AVATAR_BG[(entry.rank - 1) % AVATAR_BG.length]} flex items-center justify-center text-white text-[12px] font-bold shrink-0`}>
                  {entry.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate" style={{ color: 'var(--foreground)' }}>
                    {entry.name}
                    {entry.isCurrentUser && <span className="ml-1.5 text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>(you)</span>}
                  </p>
                  <p className="text-[12px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    <Coins className="w-3 h-3" strokeWidth={1.8} />{entry.tokens} tokens
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 40%, transparent)' }} strokeWidth={1.5} />
              </motion.button>
            ))}
          </AnimatePresence>

          {!showAll && leaderboardData.length > 7 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 text-[13px] font-semibold transition-colors border-t"
              style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}
            >
              Show more
              <ChevronDown className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}
        </motion.div>
      </div>

      <UserProfileModal user={selectedUser ? { ...selectedUser, isCurrentUser: selectedUser.isCurrentUser ?? false } : null} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
