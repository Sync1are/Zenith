import React, { useState, useEffect, useRef, useMemo } from "react";
import { PlayIcon, PauseIcon } from "./icons/IconComponents";
import { useAppStore } from "../store/useAppStore";
import { TaskStatus } from "../types";
import { AnimatePresence, motion } from "framer-motion";
import SpotifyCard from "../components/SpotifyCard";


// ===============================
// Particle Background (soft stars)
// ===============================
const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();

    const particles: Array<{ x: number; y: number; r: number; dx: number; dy: number; o: number }> = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (Math.random() * 2 + 1) * DPR,
        dx: (Math.random() - 0.5) * 0.35 * DPR,
        dy: (Math.random() - 0.5) * 0.35 * DPR,
        o: Math.random() * 0.5 + 0.2,
      });
    }

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.o})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-30" />;
};

// ======================================================
// WaveCanvas: shimmering wave background for the *timer*
// (Don't change the timer element — used as-is below)
// ======================================================


// =============================================
// FocusTimer (kept exactly as your latest block)
// =============================================


const FOCUS_MODES = [
  { name: "Pomodoro", duration: 25 * 60, color: "from-orange-500 to-red-500", emoji: "🍅" },
  { name: "Deep Work", duration: 50 * 60, color: "from-purple-500 to-indigo-500", emoji: "🧠" },
  { name: "Short Break", duration: 5 * 60, color: "from-green-500 to-emerald-500", emoji: "☕" },
  { name: "Long Break", duration: 15 * 60, color: "from-blue-500 to-cyan-500", emoji: "🌴" },
];

// Mode selector buttons component
const ModeSelector: React.FC = () => {
  const focusMode = useAppStore(state => state.focusMode);
  const setFocusMode = useAppStore(state => state.setFocusMode);
  const timerActive = useAppStore(state => state.timerActive);

  return (
    <div className="flex justify-center gap-3 flex-nowrap">
      {FOCUS_MODES.map((mode) => (
        <button
          key={mode.name}
          onClick={() => setFocusMode(mode.name as typeof focusMode)}
          disabled={timerActive}
          className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 whitespace-nowrap ${focusMode === mode.name
            ? `bg-gradient-to-r ${mode.color} text-white shadow-2xl`
            : 'bg-white/10 text-gray-300 hover:bg-white/20 backdrop-blur-lg'
            } ${timerActive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="mr-2">{mode.emoji}</span>
          {mode.name}
        </button>
      ))}
    </div>
  );
};

// Timer display component (without mode buttons)
const FocusTimer: React.FC = () => {
  const focusMode = useAppStore(state => state.focusMode);
  const timerRemaining = useAppStore(state => state.timerRemaining);
  const timerActive = useAppStore(state => state.timerActive);
  const setTimerActive = useAppStore(state => state.setTimerActive);
  const resetTimer = useAppStore(state => state.resetTimer);

  // Calculate time display and progress
  const minutes = Math.floor(timerRemaining / 60).toString().padStart(2, "0");
  const seconds = (timerRemaining % 60).toString().padStart(2, "0");

  const modeData = FOCUS_MODES.find(m => m.name === focusMode) || FOCUS_MODES[0];
  const progress = ((modeData.duration - timerRemaining) / modeData.duration) * 100;

  return (
    <div className="relative">
      {/* Timer Circle */}
      <div className="relative w-80 h-80 mx-auto">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${modeData.color} opacity-20 blur-3xl animate-pulse`}></div>
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="160" cy="160" r="140" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="url(#gradient)"
            strokeWidth="12"
            fill="none"
            strokeDasharray={2 * Math.PI * 140}
            strokeDashoffset={2 * Math.PI * 140 * (1 - progress / 100)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-7xl font-bold text-white font-mono tracking-tight">
            {minutes}:{seconds}
          </div>
          <p className="text-gray-400 text-sm mt-2">{timerActive ? 'Stay focused' : 'Ready to start?'}</p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={resetTimer}
          className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all backdrop-blur-lg"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={() => setTimerActive(!timerActive)}
          className={`px-8 py-4 rounded-full font-bold text-white shadow-2xl transform hover:scale-105 transition-all bg-gradient-to-r ${modeData.color}`}
        >
          {timerActive ? (
            <div className="flex items-center gap-2">
              <PauseIcon className="w-6 h-6" />
              <span>Pause</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <PlayIcon className="w-6 h-6" />
              <span>Start</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};


// ======================================================
// Gesture hook for swipe left/right (mouse & touch)
// ======================================================


// ======================================================
// Upcoming Tasks - Vertical List
// ======================================================
const FocusTaskCarousel: React.FC = () => {
  const tasks = useAppStore(state => state.tasks);
  const activeTaskId = useAppStore(state => state.activeTaskId);
  const startTask = useAppStore(state => state.startTask);
  const timerActive = useAppStore(state => state.timerActive);
  const setTimerActive = useAppStore(state => state.setTimerActive);

  const available = useMemo(() => tasks.filter(t => t.status !== TaskStatus.DONE), [tasks]);

  const handleTaskClick = (taskId: string) => {
    if (activeTaskId === taskId && timerActive) {
      // Already active, do nothing or pause
      return;
    }
    startTask(taskId);
    setTimerActive(true);
  };

  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl select-none w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Upcoming Tasks</h3>
        <button className="p-1.5 rounded-lg hover:bg-white/10 transition">
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3 mb-6">
        {available.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No tasks available</p>
          </div>
        ) : (
          available.slice(0, 5).map((task, idx) => {
            const isActive = activeTaskId === task.id && timerActive;
            return (
              <motion.button
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${isActive
                  ? 'bg-white/15 border-white/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {/* Task Number/Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isActive ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50' : 'bg-white/10 text-white/40'
                    }`}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Task Title */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
                      {task.title}
                    </p>
                    {task.category && (
                      <p className="text-xs text-white/40 mt-0.5">{task.category}</p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/30 border border-green-500/50 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white/20" />
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {/* Add New Task Button */}
      <button className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white/60 hover:border-white/30 transition text-sm font-medium">
        + ADD NEW TASK
      </button>
    </div>
  );
};


// =============================
// Ambient Sounds (unchanged UI)
// =============================
const AmbientSounds: React.FC = () => {
  const [activeSound, setActiveSound] = useState<string | null>(null);

  const sounds = [
    { name: "Rain", icon: "🌧️", color: "from-blue-500 to-cyan-500" },
    { name: "Ocean", icon: "🌊", color: "from-teal-500 to-blue-500" },
    { name: "Forest", icon: "🌲", color: "from-green-500 to-emerald-500" },
    { name: "Fireplace", icon: "🔥", color: "from-orange-500 to-red-500" },
    { name: "Café", icon: "☕", color: "from-amber-500 to-orange-500" },
    { name: "Thunder", icon: "⚡", color: "from-purple-500 to-indigo-500" },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl mt-6">
      <h3 className="text-xl font-bold text-white mb-4">🎵 Ambient Sounds</h3>
      <div className="grid grid-cols-3 gap-3">
        {sounds.map((s) => (
          <button
            key={s.name}
            onClick={() => setActiveSound(activeSound === s.name ? null : s.name)}
            className={`p-4 rounded-2xl transition-all transform hover:scale-105 ${activeSound === s.name ? `bg-gradient-to-br ${s.color} shadow-lg` : "bg-white/10 hover:bg-white/20"
              }`}
          >
            <div className="text-3xl mb-1">{s.icon}</div>
            <p className="text-xs text-white font-medium">{s.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ======================
// Main Focus Page Layout
// ======================
const FocusPage: React.FC = () => {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#111217] ">
      {/* Gradient aura behind everything */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 rounded-full blur-3xl opacity-60 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.35),transparent_60%)]" />
        <div className="absolute inset-[-16px] rounded-full opacity-50 animate-spin-slow bg-[conic-gradient(from_0deg, rgba(147,51,234,0.15), rgba(59,130,246,0.25), rgba(236,72,153,0.2), rgba(147,51,234,0.15))]" />
      </div>

      <ParticleBackground />

      <div className="relative z-10 h-full w-full px-12 py-8 flex items-center">
        {/* Main Layout: Tasks (Left) | Timer (Center) | Ambient+Spotify (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 w-full">
          {/* LEFT: Tasks - aligned to left */}
          <div className="flex flex-col items-start justify-center">
            <FocusTaskCarousel />
          </div>

          {/* CENTER: Mode Buttons + Timer - stay centered */}
          <div className="flex flex-col items-center justify-center gap-8">
            <ModeSelector />
            <FocusTimer />
          </div>

          {/* RIGHT: Ambient Sounds + Spotify - aligned to right */}
          <div className="flex flex-col items-end justify-center gap-6">
            <AmbientSounds />
            <SpotifyCard />
          </div>
        </div>
      </div>

      {/* slow conic spin helper */}
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg);} }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
};


export default FocusPage;
