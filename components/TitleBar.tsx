// src/components/TitleBar.tsx
import { X, Square, Minus } from "lucide-react"; // ✅ icons
// Install if needed: npm install lucide-react

const TitleBar = () => {
  return (
    <div
  className="h-10 bg-[#111217] flex items-center justify-end px-4 select-none z-50"
  style={{ WebkitAppRegion: "drag" }}
>

      <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" }}>
        
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
