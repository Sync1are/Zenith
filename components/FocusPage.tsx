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

    const particles: Array<{ x: number; y: number; r: number; dx: number; dy: number; o: number }>=[];
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
const WaveCanvas: React.FC<{ isPaused: boolean }> = ({ isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const waves = [
      { amp: 20, freq: 0.02, speed: 0.03, color: "rgba(99, 102, 241, 0.4)" },
      { amp: 25, freq: 0.015, speed: 0.04, color: "rgba(129, 140, 248, 0.3)" },
      { amp: 15, freq: 0.025, speed: 0.05, color: "rgba(79, 70, 229, 0.5)" },
    ];

    const render = () => {
      t += isPaused ? 0.2 : 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let i = 0; i < canvas.width / (window.devicePixelRatio || 1); i++) {
          const y = Math.sin(i * wave.freq + t * wave.speed) * wave.amp * Math.sin((i / (canvas.width / (window.devicePixelRatio || 1))) * Math.PI);
          ctx.lineTo(i, canvas.height / 2 + y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.fillStyle = wave.color;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [isPaused]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" />;

};

// =============================================
// FocusTimer (kept exactly as your latest block)
// =============================================


const FOCUS_MODES = [
  { name: "Pomodoro", duration: 25 * 60, color: "from-orange-500 to-red-500", emoji: "🍅" },
  { name: "Deep Work", duration: 50 * 60, color: "from-purple-500 to-indigo-500", emoji: "🧠" },
  { name: "Short Break", duration: 5 * 60, color: "from-green-500 to-emerald-500", emoji: "☕" },
  { name: "Long Break", duration: 15 * 60, color: "from-blue-500 to-cyan-500", emoji: "🌴" },
];

const FocusTimer: React.FC = () => {
  // Store hooks instead of local state
  const focusMode = useAppStore(state => state.focusMode);
  const setFocusMode = useAppStore(state => state.setFocusMode);
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
      {/* Mode Buttons */}
      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        {FOCUS_MODES.map((mode) => (
          <button
            key={mode.name}
            onClick={() => setFocusMode(mode.name as typeof focusMode)}
            disabled={timerActive}
            className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
              focusMode === mode.name
                ? `bg-gradient-to-r ${mode.color} text-white shadow-2xl`
                : 'bg-white/10 text-gray-300 hover:bg-white/20 backdrop-blur-lg'
            } ${timerActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="mr-2">{mode.emoji}</span>
            {mode.name}
          </button>
        ))}
      </div>

      {/* Timer Circle - EXACT SAME STYLE */}
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
              <stop offset="0%" stopColor="#F97316"/>
              <stop offset="100%" stopColor="#EF4444"/>
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
const useSwipe = (onSwipe: (dir: "left" | "right") => void) => {
  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    deltaX.current = 0;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    deltaX.current = e.clientX - startX.current;
  };
  const onPointerUp = () => {
    if (startX.current == null) return;
    const d = deltaX.current;
    startX.current = null;
    deltaX.current = 0;
    const THRESHOLD = 80; // px
    if (d <= -THRESHOLD) onSwipe("left");
    else if (d >= THRESHOLD) onSwipe("right");
  };
  return { onPointerDown, onPointerMove, onPointerUp };
};

// ======================================================
// Active Tasks – Single-card, swipeable with transitions
// ======================================================
// ======================================================
// Active Tasks – Single-card, swipeable with transitions
// ======================================================
const FocusTaskCarousel: React.FC = () => {
  const tasks = useAppStore(state => state.tasks);
  const activeTaskId = useAppStore(state => state.activeTaskId);
  const startTask = useAppStore(state => state.startTask);
  const pauseTask = useAppStore(state => state.pauseTask);

  // ✅ ADD THESE (you were missing them)
  const timerActive = useAppStore(state => state.timerActive);
  const setTimerActive = useAppStore(state => state.setTimerActive);

  const available = useMemo(() => tasks.filter(t => t.status !== TaskStatus.DONE), [tasks]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!activeTaskId) return;
    const i = available.findIndex(t => t.id === activeTaskId);
    if (i >= 0) setIndex(i);
  }, [activeTaskId, available]);

  useEffect(() => {
    setIndex(i => Math.max(0, Math.min(i, available.length - 1)));
  }, [available.length]);

  const go = (dir: "left" | "right") => {
    setIndex(i => {
      if (dir === "left") return Math.min(i + 1, available.length - 1);
      return Math.max(i - 1, 0);
    });
  };

  const { onPointerDown, onPointerMove, onPointerUp } = useSwipe(go);

  const wheelLock = useRef(false);
  const onWheel: React.WheelEventHandler<HTMLDivElement> = e => {
    if (wheelLock.current) return;
    if (Math.abs(e.deltaY) < 10 && Math.abs(e.deltaX) < 10) return;
    wheelLock.current = true;
    go(e.deltaY > 0 || e.deltaX > 0 ? "left" : "right");
    setTimeout(() => (wheelLock.current = false), 350);
  };

  const current = available[index];

  // ✅ FIX STATE SYNC: Task is "Running" only when timer is active
  const isActive = activeTaskId === current?.id && timerActive;

  // ✅ FIX BUTTON LOGIC
  const handleToggle = () => {
    if (!current) return;

    if (activeTaskId === current.id && timerActive) {
      pauseTask();
      setTimerActive(false);
    } else {
      startTask(current.id);
      setTimerActive(true);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-2xl select-none">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white">📋 Current Task</h3>
        <span className="text-xs text-gray-400">{available.length ? `${index + 1} / ${available.length}` : "0 / 0"}</span>
      </div>

      {available.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No tasks available</p>
        </div>
      ) : (
        <div
          className="relative h-[120px] overflow-hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
          role="group"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {current && (
              <motion.div
                key={current.id}
                initial={{ x: 60, opacity: 0, scale: 0.97 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -60, opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={`h-full rounded-2xl p-3 bg-gradient-to-br border border-white/10 flex flex-col justify-between shadow-lg ${
                  isActive ? "from-purple-500/25 to-indigo-500/20" : "from-white/10 to-white/5"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="text-gray-300 bg-white/10 px-2 py-0.5 rounded">{current.category}</span>
                    <span className="text-gray-300">⏱️ {current.duration || "--"}</span>
                    <span
                      className={`px-2 rounded border ${
                        current.priority === "HIGH"
                          ? "border-red-400 text-red-300"
                          : current.priority === "MEDIUM"
                          ? "border-yellow-400 text-yellow-300"
                          : "border-blue-400 text-blue-300"
                      }`}
                    >
                      {current.priority}
                    </span>
                  </div>
                  <h4 className={`mt-1 font-bold text-base truncate ${isActive ? "text-purple-100" : "text-white"}`}>
                    {current.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-400/60"}`} />
                    <span className="text-xs text-gray-300">{isActive ? "Running" : "Idle"}</span>
                  </div>

               <button
  onClick={(e) => {
    e.stopPropagation(); // ⛔ prevent swipe handler from blocking click
    handleToggle();
  }}
  onPointerDown={(e) => e.stopPropagation()} // ⛔ stop gesture capture
  className={`px-4 py-1 rounded-full font-medium text-xs text-white shadow-xl bg-gradient-to-r ${
    isActive ? "from-pink-500 to-rose-500" : "from-purple-500 to-indigo-500"
  } hover:brightness-110 transition pointer-events-auto`}
>
  {isActive ? "Pause" : "Start"}
</button>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {available.length > 0 && (
        <div className="flex justify-center gap-1 mt-2">
          {available.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition ${
                i === index ? "bg-white" : "bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
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
            className={`p-4 rounded-2xl transition-all transform hover:scale-105 ${
              activeSound === s.name ? `bg-gradient-to-br ${s.color} shadow-lg` : "bg-white/10 hover:bg-white/20"
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

      <div className="relative z-10 h-full max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Focus Mode</h1>
          <p className="text-gray-400">Stay productive with focused work sessions</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">
          <div className="lg:col-span-2 flex items-center justify-center">
            <FocusTimer />
          </div>
          <div className="flex flex-col h-full overflow-hidden">
            <FocusTaskCarousel />
            <AmbientSounds />
            <SpotifyCard />
            {/* Optional: Spotify section here */}
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
