import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import {
  LogoIcon,
  DashboardIcon,
  TasksIcon,
  CalendarIcon,
  FocusIcon,
  AnalyticsIcon,
  SettingsIcon
} from "./icons/IconComponents";


interface SidebarProps {
  activeItem: string;
  onSelect: (item: string) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
}


const navItems = [
  { label: "Dashboard", icon: <DashboardIcon className="h-6 w-6" /> },
  { label: "Tasks", icon: <TasksIcon className="h-6 w-6" /> },
  { label: "Calendar", icon: <CalendarIcon className="h-6 w-6" /> },
  { label: "Focus", icon: <FocusIcon className="h-6 w-6" /> },
  { label: "Analytics", icon: <AnalyticsIcon className="h-6 w-6" /> },
  { label: "Settings", icon: <SettingsIcon className="h-6 w-6" /> }
];


const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem, 
  onSelect, 
  isMobileDrawerOpen, 
  setIsMobileDrawerOpen 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAutoHidden, setIsAutoHidden] = useState(false);
  
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);
  const mouseStartX = useRef(0);
  const isMouseDragging = useRef(false);
  const hoverTimeoutRef = useRef<number | null>(null);


  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlight, setHighlight] = useState({ top: 0, height: 0 });
  const [ready, setReady] = useState(false);


  // Update highlight position
  const updateHighlight = () => {
    const index = navItems.findIndex((i) => i.label === activeItem);
    const btn = btnRefs.current[index];


    if (btn) {
      const { offsetTop, offsetHeight } = btn;
      setHighlight({ top: offsetTop, height: offsetHeight });
      if (!ready) setReady(true);
    }
  };


  useLayoutEffect(() => {
    updateHighlight();
  }, [activeItem, isExpanded]);


  // Force update on mount to fix initial positioning
  useEffect(() => {
    const timer = setTimeout(updateHighlight, 50);
    return () => clearTimeout(timer);
  }, []);


  // Auto-hide after 3 seconds on mount
  useEffect(() => {
    const autoHideTimer = setTimeout(() => {
      setIsAutoHidden(true);
    }, 3000);

    return () => clearTimeout(autoHideTimer);
  }, []);


  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  };


  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchDuration = Date.now() - touchStartTime.current;
    const swipeDistance = touchEndX - touchStartX.current;


    if (
      touchStartX.current < 50 &&
      swipeDistance > 100 &&
      touchDuration < 500
    ) {
      setIsMobileDrawerOpen(true);
    }
  };


  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.clientX < 50) {
      isMouseDragging.current = true;
      mouseStartX.current = e.clientX;
    }
  };


  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDragging.current) {
      const dragDistance = e.clientX - mouseStartX.current;
      if (dragDistance > 100) {
        setIsMobileDrawerOpen(true);
        isMouseDragging.current = false;
      }
    }
  };


  const handleMouseUp = () => {
    isMouseDragging.current = false;
  };


  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);


    ripple.style.position = "absolute";
    ripple.style.borderRadius = "50%";
    ripple.style.background = "rgba(255,255,255,0.25)";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    ripple.style.transform = "scale(0)";
    ripple.style.opacity = "1";
    ripple.style.animation = "ripple-effect 600ms ease-out";
    ripple.style.pointerEvents = "none";


    button.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  };


  const handleNavItemClick = (item: string) => {
    onSelect(item);
    setIsMobileDrawerOpen(false);
  };


  const toggleExpanded = () => {
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsAnimating(false), 600);
  };


  // Auto-hide handlers for desktop
  const handleMouseEnterTrigger = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsAutoHidden(false);
  };


  const handleMouseLeaveSidebar = () => {
    // Delay hiding by 500ms to prevent flickering
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsAutoHidden(true);
    }, 500);
  };


  return (
    <>
      {/* Desktop Auto-hide Trigger Zone */}
      <div 
        className="hidden md:block fixed left-0 top-0 h-screen w-4 z-40"
        onMouseEnter={handleMouseEnterTrigger}
      />

      {/* Desktop Sidebar - Hidden on small screens, centered vertically */}
      <div 
        className={`
          hidden md:flex items-center fixed left-0 top-0 h-screen z-50
          transition-transform duration-300 ease-in-out
          ${isAutoHidden ? '-translate-x-full' : 'translate-x-0 ml-4'}
        `}
        onMouseLeave={handleMouseLeaveSidebar}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
        }}
      >
        <aside
          className={`
            flex flex-col
            bg-[#1C1C1E]/80 backdrop-blur-xl border border-[#2A2A2E]
            shadow-[0_8px_30px_rgba(0,0,0,0.45)]
            rounded-xl p-4 transition-all duration-300
            ${isExpanded ? "w-64" : "w-20"}
          `}
        >
          {/* Logo as Toggle Button */}
          <div className={`flex items-center text-white mb-6 ${!isExpanded ? "justify-center px-0" : "px-2"}`}>
            <button
              onClick={toggleExpanded}
              className={`p-1 rounded-lg hover:bg-[#2A2A2E] transition-all duration-300
                ${isAnimating ? "scale-110 rotate-180" : "scale-100 rotate-0"}
              `}
              title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              <LogoIcon className="h-9 w-9" />
            </button>
            <span
              className={`text-2xl font-bold whitespace-nowrap overflow-hidden transition-all duration-300
              ${isExpanded ? "opacity-100 ml-3 w-32" : "opacity-0 ml-0 w-0"}`}
            >
              Zenith
            </span>
          </div>


          {/* Nav */}
          <nav className="relative flex flex-col space-y-2 overflow-hidden">
            {ready && (
              <div
                className="absolute left-0 right-0 bg-indigo-600 rounded-lg transition-all duration-300"
                style={{
                  height: highlight.height,
                  transform: `translateY(${highlight.top}px)`
                }}
              />
            )}


            {navItems.map((item, index) => (
              <button
                key={item.label}
                ref={(el) => { btnRefs.current[index] = el; }}
                onClick={(e) => {
                  createRipple(e);
                  onSelect(item.label);
                }}
                className={`
                  relative flex items-center w-full px-3 py-3 rounded-lg overflow-hidden
                  transition-colors duration-200 z-10
                  ${activeItem === item.label ? "text-white" : "text-gray-400 hover:text-white"}
                  ${!isExpanded && "justify-center"}
                `}
              >
                {item.icon}
                <span
                  className={`font-medium whitespace-nowrap transition-all duration-300
                  ${isExpanded ? "opacity-100 ml-4 w-32" : "opacity-0 ml-0 w-0"}`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </aside>
      </div>


      {/* Mobile Gesture Handler - Touch & Mouse Drag */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="md:hidden fixed left-0 top-0 w-16 h-full z-40 pointer-events-auto"
      />


      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-50"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}


      {/* Mobile Sidebar Drawer */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 md:hidden
          bg-[#1C1C1E]/95 backdrop-blur-xl border-r border-[#2A2A2E]
          shadow-[0_8px_30px_rgba(0,0,0,0.45)]
          p-4 transition-transform duration-300 z-50
          ${isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between text-white px-2 mb-6">
          <div className="flex items-center">
            <LogoIcon className="h-9 w-9" />
            <span className="text-2xl font-bold ml-3">Zenith</span>
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>


        {/* Nav */}
        <nav className="relative flex flex-col space-y-2 overflow-hidden">
          {navItems.map((item, index) => (
            <button
              key={item.label}
              onClick={(e) => {
                createRipple(e);
                handleNavItemClick(item.label);
              }}
              className={`
                relative flex items-center w-full px-3 py-3 rounded-lg overflow-hidden
                transition-colors duration-200
                ${activeItem === item.label 
                  ? "text-white bg-indigo-600" 
                  : "text-gray-400 hover:text-white hover:bg-[#2A2A2E]"}
              `}
            >
              {item.icon}
              <span className="font-medium ml-4 w-32">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};


export default Sidebar;
