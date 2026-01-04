// src/components/TitleBar.tsx
import { X, Square, Minus, PictureInPicture2 } from "lucide-react";

const TitleBar = () => {
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
          onClick={() => window.electronAPI.setCompactMode()}
          className="w-9 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#242429] transition-colors"
          title="Compact Mode"
        >
          <PictureInPicture2 size={14} strokeWidth={2.4} />
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
