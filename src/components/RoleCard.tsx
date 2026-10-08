import { ReactNode } from 'react';

interface RoleCardProps {
  id: 'artist' | 'venue' | 'fan';
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  accentColor: 'violet' | 'cyan' | 'pink';
  onSelect: (role: 'artist' | 'venue' | 'fan') => void;
}

export function RoleCard({
  id,
  title,
  description,
  icon,
  selected,
  accentColor,
  onSelect,
}: RoleCardProps) {
  const borderStyles = {
    violet: selected ? 'border-violet-500 shadow-violet-500/30' : 'hover:border-violet-500/40',
    cyan: selected ? 'border-cyan-400 shadow-cyan-400/30' : 'hover:border-cyan-400/40',
    pink: selected ? 'border-pink-500 shadow-pink-500/30' : 'hover:border-pink-500/40',
  };

  const badgeStyles = {
    violet: selected ? 'bg-violet-600 text-white' : 'bg-violet-500/20 text-violet-300',
    cyan: selected ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-cyan-500/20 text-cyan-300',
    pink: selected ? 'bg-pink-600 text-white' : 'bg-pink-500/20 text-pink-300',
  };

  return (
    <div
      onClick={() => onSelect(id)}
      role="button"
      tabIndex={0}
      className={`relative cursor-pointer rounded-2xl p-6 glass-panel border transition-all text-left flex flex-col justify-between ${
        selected ? 'shadow-xl scale-[1.02] bg-white/[0.08]' : 'hover:bg-white/[0.04]'
      } ${borderStyles[accentColor]}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${badgeStyles[accentColor]}`}>{icon}</div>
          {selected && (
            <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
              <svg className="w-3 h-3 text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
