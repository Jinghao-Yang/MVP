import { memo, useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { FileText, Plus, Layout, Maximize2, Minimize2, Search, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { useOverlay } from '@/hooks/useOverlay';
import { useUiStore } from '@/stores/ui-store';
import { useDocument } from '@/hooks/useDocument';
import { toast } from 'sonner';
import type { DocumentEntity } from '@/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type CommandType = 'navigate' | 'document' | 'action' | 'system';

interface CommandItem {
  id: string;
  type: CommandType;
  label: string;
  description?: string;
  shortcut?: string;
  icon: typeof FileText;
  action: () => void;
}

function CommandPaletteComponent({ isOpen, onClose }: CommandPaletteProps) {
  const { overlayProps } = useOverlay({ isOpen, onClose });
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState<DocumentEntity[]>([]);
  const { getAllDocuments, createDocument, setCurrentWikiId } = useDocument();
  const { setActivePage, setZenMode, isZenMode, setStatus } = useUiStore();

  // 加载文档列表
  useEffect(() => {
    if (isOpen) {
      getAllDocuments().then((docs) => {
        setDocuments(docs);
      });
    }
  }, [isOpen, getAllDocuments]);

  // 重置搜索状态
  useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // 创建新文档
  const handleCreateDocument = useCallback(async () => {
    const title = search.trim() || 'Untitled Document';
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    try {
      await createDocument({
        id,
        title,
        content: '',
        badge: 'new',
        badgeClass: 'bg-green-100 text-green-700',
        updatedAt: Date.now(),
      });
      setCurrentWikiId(id);
      setActivePage('editor');
      toast.success(`Created "${title}"`);
      onClose();
    } catch (error) {
      toast.error('Failed to create document');
    }
  }, [search, createDocument, setCurrentWikiId, setActivePage, onClose]);

  // 导航到文档
  const handleNavigateToDocument = useCallback((doc: DocumentEntity) => {
    setCurrentWikiId(doc.id);
    setActivePage('editor');
    onClose();
  }, [setCurrentWikiId, setActivePage, onClose]);

  // 切换视图
  const handleNavigateToPage = useCallback((page: string) => {
    setActivePage(page);
    onClose();
  }, [setActivePage, onClose]);

  // 切换禅模式
  const handleToggleZenMode = useCallback(() => {
    setZenMode(!isZenMode);
    setStatus(!isZenMode ? 'Zen mode activated.' : 'Restored layout.');
    toast.info(!isZenMode ? 'Zen mode activated.' : 'Restored layout.');
    onClose();
  }, [setZenMode, isZenMode, setStatus, onClose]);

  // 强制合成
  const handleForceSynthesis = useCallback(() => {
    setStatus('Running synthesis...');
    toast.info('Running synthesis...');
    onClose();
  }, [setStatus, onClose]);

  // 构建命令列表
  const buildCommands = (): CommandItem[] => {
    const baseCommands: CommandItem[] = [
      {
        id: 'nav-project',
        type: 'navigate',
        label: 'Project Hub',
        description: 'Go to project overview',
        shortcut: 'GO PJ',
        icon: Layout,
        action: () => handleNavigateToPage('project'),
      },
      {
        id: 'nav-editor',
        type: 'navigate',
        label: 'Focus Editor',
        description: 'Open the document editor',
        shortcut: 'GO ED',
        icon: FileText,
        action: () => handleNavigateToPage('editor'),
      },
      {
        id: 'create-doc',
        type: 'document',
        label: 'Create New Document',
        description: `Create "${search || 'Untitled'}"`,
        shortcut: 'NEW',
        icon: Plus,
        action: handleCreateDocument,
      },
      {
        id: 'toggle-zen',
        type: 'action',
        label: isZenMode ? 'Exit Zen Mode' : 'Toggle Zen Mode',
        description: isZenMode ? 'Restore normal layout' : 'Enter distraction-free mode',
        shortcut: 'CMD Z',
        icon: isZenMode ? Minimize2 : Maximize2,
        action: handleToggleZenMode,
      },
      {
        id: 'force-synthesis',
        type: 'system',
        label: 'Force Synthesis',
        description: 'Trigger knowledge synthesis',
        shortcut: 'RUN SYN',
        icon: Sparkles,
        action: handleForceSynthesis,
      },
    ];

    // 添加文档命令
    const documentCommands: CommandItem[] = documents.map((doc) => ({
      id: `doc-${doc.id}`,
      type: 'document',
      label: doc.title,
      description: new Date(doc.updatedAt).toLocaleDateString(),
      shortcut: undefined,
      icon: FileText,
      action: () => handleNavigateToDocument(doc),
    }));

    return [...baseCommands, ...documentCommands];
  };

  const commands = buildCommands();

  const getGroupedCommands = () => {
    return {
      Navigation: commands.filter((c) => c.type === 'navigate'),
      Documents: commands.filter((c) => c.type === 'document'),
      Actions: commands.filter((c) => c.type === 'action'),
      System: commands.filter((c) => c.type === 'system'),
    };
  };

  const groupedCommands = getGroupedCommands();

  return (
    <>
      <div {...overlayProps} />
      <Command.Dialog
        open={isOpen}
        onOpenChange={onClose}
        className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[var(--z-command)] w-[600px] max-w-[90vw]"
      >
        <div className="glass-panel-deep p-2">
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="w-full bg-transparent border-b border-white/30 text-lg p-4 outline-none font-sys text-black placeholder-black/30"
            aria-label="搜索命令"
          />
          <Command.List className="py-2 max-h-[400px] overflow-y-auto scroll-hide">
            <Command.Empty className="px-4 py-8 text-sm text-black/40">
              No commands found
            </Command.Empty>
            {Object.entries(groupedCommands).map(([group, items]) => (
              <Command.Group key={group} heading={group}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-black/40 px-3 py-2">
                  {group}
                </div>
                {items.map((command) => (
                  <Command.Item
                    key={command.id}
                    value={command.label}
                    onSelect={command.action}
                    className="flex items-center gap-3 p-3 hover:bg-white/40 cursor-pointer transition-colors group"
                  >
                    <command.icon className="w-4 h-4 text-black/50 group-hover:text-black transition-colors" />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-black">{command.label}</div>
                      {command.description && (
                        <div className="text-xs text-black/40">{command.description}</div>
                      )}
                    </div>
                    {command.shortcut && (
                      <kbd className="text-[10px] font-mono text-black/30">
                        {command.shortcut}
                      </kbd>
                    )}
                    <ArrowRight className="w-3 h-3 text-black/20 group-hover:text-black/40 transition-colors" />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}

export const CommandPalette = memo(CommandPaletteComponent);
