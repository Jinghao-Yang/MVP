import { useEffect, useState, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { ProjectPage } from "./components/ProjectPage";
import { EditorPage } from "./components/EditorPage";
import { Zap, PenTool, Layout } from "lucide-react";

export default function App() {
  const [activePage, setActivePage] = useState("project");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isZenMode, setZenMode] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("System active.");
  const [showStatus, setShowStatus] = useState(true);
  const [quickCaptureText, setQuickCaptureText] = useState("");
  const statusTimeout = useRef<number | null>(null);

  const setStatus = (msg: string) => {
    setStatusMsg(msg);
    setShowStatus(true);
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    statusTimeout.current = window.setTimeout(() => {
      setShowStatus(false);
    }, 2500);
  };

  useEffect(() => {
    setStatus("System active.");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (quickCaptureText.trim()) {
          setStatus("Captured: " + quickCaptureText);
          setQuickCaptureText("");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickCaptureText]);

  useEffect(() => {
    // Add/remove zen class to body for background layout shifts if needed
    if (isZenMode) {
      document.body.classList.add("zen-active");
    } else {
      document.body.classList.remove("zen-active");
    }
  }, [isZenMode]);

  return (
    <>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
        openPage={(p) => setActivePage(p)}
        openCommandPalette={() => setCommandPaletteOpen(true)}
        setStatus={setStatus}
      />

      <div className="main-content" id="main-content">
        {activePage === "project" && <ProjectPage openPage={setActivePage} />}
        {activePage === "editor" && (
          <EditorPage 
            isZenMode={isZenMode}
            onToggleZen={() => {
              setZenMode(!isZenMode);
              setStatus(!isZenMode ? "Zen mode activated." : "Restored layout.");
            }}
            openPage={setActivePage}
            setStatus={setStatus}
          />
        )}
      </div>

      <div className={`quick-capture glass-panel ${isZenMode ? "collapsed" : ""}`}>
        <Zap className="w-4 h-4 text-[var(--bh-yellow)]" />
        <input 
          type="text" 
          placeholder="Capture a fleeting thought..." 
          value={quickCaptureText}
          onChange={(e) => setQuickCaptureText(e.target.value)}
        />
        <span className="meta opacity-40">⌘↵</span>
      </div>

      <div 
        className={`fixed bottom-24 right-6 bg-white text-black font-mono text-[10px] px-4 py-2 border border-neutral-200 shadow-xl transition-all duration-300 pointer-events-none z-50 uppercase tracking-widest ${showStatus ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {statusMsg}
      </div>

      {/* Command Palette Overlay */}
      <div 
        className={`command-overlay fixed inset-0 z-[99] bg-black/5 backdrop-blur-sm transition-opacity duration-300 ${isCommandPaletteOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setCommandPaletteOpen(false)}
      ></div>
      <div 
        className={`command-palette fixed top-[20%] left-1/2 -translate-x-1/2 glass-panel-deep w-[600px] max-w-[90vw] p-2 z-[100] transition-all duration-300 ${isCommandPaletteOpen ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-95"}`}
      >
        <input 
          type="text" 
          placeholder="Command..." 
          className="w-full bg-transparent border-b border-white/30 text-lg p-4 outline-none font-sys text-black placeholder-black/30"
          autoFocus={isCommandPaletteOpen}
        />
        <div className="py-2">
          <div className="flex items-center gap-3 p-3 hover:bg-white/40 cursor-pointer transition-colors" onClick={() => { setActivePage("editor"); setCommandPaletteOpen(false); }}>
            <PenTool className="w-4 h-4 text-[var(--bh-red)]" />
            <span className="text-sm font-medium">Focus Editor</span>
          </div>
          <div className="flex items-center gap-3 p-3 hover:bg-white/40 cursor-pointer transition-colors" onClick={() => { setActivePage("project"); setCommandPaletteOpen(false); }}>
            <Layout className="w-4 h-4 text-[var(--bh-blue)]" />
            <span className="text-sm font-medium">Project Hub</span>
          </div>
        </div>
      </div>
    </>
  );
}
