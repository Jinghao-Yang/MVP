import { Sidebar } from "./components/Sidebar";
import { ProjectPage } from "./components/ProjectPage";
import { EditorPage } from "./components/EditorPage";
import { CommandPalette } from "./components/CommandPalette";
import { QuickCapture } from "./components/QuickCapture";
import { useAppState } from "./hooks/useAppState";

export default function App() {
  const {
    activePage,
    setActivePage,
    isSidebarActiveCollapsed,
    handleSidebarMouseEnter,
    handleSidebarMouseLeave,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    statusMsg,
    showStatus,
    quickCaptureText,
    setQuickCaptureText,
    setStatus,
    getMarginClass,
    isZenMode,
    setZenMode
  } = useAppState();

  return (
    <>
      {activePage === "editor" && !isSidebarActiveCollapsed && (
        <div 
          onMouseEnter={handleSidebarMouseEnter}
          className="fixed top-0 left-0 bottom-0 w-3 z-50 bg-transparent cursor-e-resize"
        />
      )}

      <Sidebar 
        isCollapsed={isSidebarActiveCollapsed} 
        onToggle={() => {}}
        openPage={setActivePage}
        openCommandPalette={() => setCommandPaletteOpen(true)}
        setStatus={setStatus}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        activePage={activePage}
      />

      <div 
        className={`main-content transition-[margin-left] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${getMarginClass()}`}
        id="main-content"
      >
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

      <QuickCapture
        isZenMode={isZenMode}
        value={quickCaptureText}
        onChange={setQuickCaptureText}
        onSubmit={() => {
          setStatus("Captured: " + quickCaptureText);
          setQuickCaptureText("");
        }}
      />

      <div 
        className={`fixed bottom-24 right-6 bg-white text-black font-mono text-[10px] px-4 py-2 border border-neutral-200 shadow-xl transition-all duration-300 pointer-events-none z-50 uppercase tracking-widest ${showStatus ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {statusMsg}
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenPage={setActivePage}
      />
    </>
  );
}