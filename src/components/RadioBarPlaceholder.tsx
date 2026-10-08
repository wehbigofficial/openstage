export function RadioBarPlaceholder() {
  return (
    <div
      id="radio-bar-container"
      className="fixed bottom-0 left-0 right-0 z-30 h-14 bg-[#0a0a14]/90 backdrop-blur-md border-t border-cyan-500/20 px-4 flex items-center justify-between text-xs text-slate-400"
    >
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-medium text-slate-300">OpenStage Indie Radio (Live Stream)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500 italic">Continuous live music stream coming in Phase 4</span>
      </div>
    </div>
  );
}
