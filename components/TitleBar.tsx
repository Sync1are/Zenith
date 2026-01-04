// src/components/TitleBar.tsx
import { X, Square, Minus, AppWindow } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

const TitleBar = () => {
  const setCompactMode = useAppStore((state) => state.setCompactMode);

  const handleCompactMode = () => {
    // 1. Update React state to switch UI to <CompactView />
    setCompactMode(true);
    // 2. Tell Electron to resize the window and stick to bottom-right
    if (window.electronAPI?.setCompactMode) {
      window.electronAPI.setCompactMode();
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 h-10 flex items-center justify-end px-4 select-none z-50"
      style={{
        WebkitAppRegion: "drag",
        background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        backdropFilter: "blur(10px) saturate(1.05)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 30px rgba(15,12,30,0.5)"
      } as React.CSSProperties}
    >
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>

        {/* Compact Mode */}
        <button
          onClick={handleCompactMode}
          className="w-9 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#242429] transition-colors"
          title="Compact Mode"
        >
          <AppWindow size={14} strokeWidth={2.4} />
        </button>

        {/* Minimize */}
        <button
          onClick={() => window.electronAPI.minimize()}
          className="w-9 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#242429] transition-colors"
        >
          <Minus size={14} strokeWidth={2.4} />
        </button>

        {/* Maximize */}
        <button
          onClick={() => window.electronAPI.maximize()}
          className="w-9 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#242429] transition-colors"
        >
          <Square size={12} strokeWidth={2.2} />
        </button>

        {/* Close (red on hover) */}
        <button
          onClick={() => window.electronAPI.close()}
          className="w-9 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#E5484D] transition-colors"
        >
          <X size={15} strokeWidth={2.4} />
        </button>

      </div>
    </div>
  );
};

export default TitleBar;
