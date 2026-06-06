/* ================================================
   FILE: src/components/TypeManager.tsx
   ================================================ */
import { useState, useActionState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { toast } from 'sonner';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// Help helper to resolve Lucide dynamic icons with fallback
export function CustomLucideIcon({
  name,
  className = 'w-4 h-4',
}: {
  name: string;
  className?: string;
}) {
  const IconComponent =
    (Icons as unknown as Record<string, React.FC<LucideProps>>)[name] || Icons.HelpCircle;
  return <IconComponent className={className} />;
}

const AVAILABLE_ICONS = [
  'Book',
  'Layers',
  'User',
  'CheckCircle',
  'Archive',
  'Briefcase',
  'Calendar',
  'Folder',
  'Hash',
  'Heart',
  'Home',
  'Lightbulb',
  'Map',
  'Star',
  'Bookmark',
  'Tag',
  'FileText',
  'Atom',
  'Sparkles',
  'Compass',
  'Wallet',
  'Code',
  'Wrench',
  'Database',
];

interface TypeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActionState {
  error: string | null;
  success: boolean;
}

async function createTypeAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const typeName = (formData.get('typeName') as string).trim();
  const selectedIcon = formData.get('selectedIcon') as string;

  if (!typeName) {
    return { error: 'Please enter an object type name.', success: false };
  }

  const typeId = typeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (!typeId) {
    return { error: 'Invalid name. Type ID cannot be empty.', success: false };
  }

  const existing = await db.objectTypes.get(typeId);
  if (existing) {
    return { error: `A type with ID "${typeId}" already exists.`, success: false };
  }

  try {
    await db.objectTypes.put({
      id: typeId,
      name: typeName,
      icon: selectedIcon,
    });

    await db.properties.bulkPut([
      { id: `prop-${typeId}-status`, typeId: typeId, name: 'Status', dataType: 'text' },
      { id: `prop-${typeId}-notes`, typeId: typeId, name: 'Notes', dataType: 'text' },
    ]);

    toast.success(`Successfully registered "${typeName}" object type!`);
    return { error: null, success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to create new object type.', success: false };
  }
}

export function TypeManager({ isOpen, onClose }: TypeManagerProps) {
  const objectTypes = useLiveQuery(() => db.objectTypes.toArray(), []);
  const documents = useLiveQuery(() => db.documents.toArray(), []);

  const [typeName, setTypeName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Layers');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [state, formAction, isPending] = useActionState(createTypeAction, {
    error: null,
    success: false,
  });

  if (!isOpen) return null;

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    setTypeName('');
    setSelectedIcon('Layers');
  };

  const handleDeleteType = async (typeId: string) => {
    // Check if system standard
    const systemTypes = ['page', 'note', 'person', 'project', 'book', 'task'];
    if (systemTypes.includes(typeId)) {
      toast.error('System standard object types cannot be deleted.');
      return;
    }

    // Check if used by any documents
    const associatedDocs = (documents || []).filter((doc) => doc.typeId === typeId);
    if (associatedDocs.length > 0) {
      toast.error(
        `Cannot delete type "${typeId}": It is currently assigned to ${associatedDocs.length} documents.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete the "${typeId}" object type?`)) {
      try {
        await db.objectTypes.delete(typeId);
        // Clean properties
        const props = await db.properties.where('typeId').equals(typeId).toArray();
        for (const p of props) {
          await db.properties.delete(p.id);
        }
        toast.info(`Deleted "${typeId}" object type.`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete object type.');
      }
    }
  };

  const handleStartEdit = (typeId: string, currentName: string) => {
    setEditingTypeId(typeId);
    setEditingName(currentName);
  };

  const handleSaveEdit = async (typeId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty.');
      return;
    }

    try {
      await db.objectTypes.update(typeId, { name: trimmed });
      setEditingTypeId(null);
      toast.success('Updated object type name.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update name.');
    }
  };

  const handleUpdateIcon = async (typeId: string, iconName: string) => {
    try {
      await db.objectTypes.update(typeId, { icon: iconName });
      toast.success(`Updated icon to ${iconName}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update icon.');
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 shadow-2xl rounded-none w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="space-y-0.5">
            <h3 className="font-sys text-sm font-bold uppercase tracking-wider text-neutral-800">
              Manage Object Types
            </h3>
            <p className="text-[10px] text-neutral-400 font-mono">
              The Capacities Way // Custom schemas and semantic labels
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 text-xs font-mono font-bold hover:bg-neutral-100 rounded cursor-pointer border-none bg-transparent transition-all flex items-center gap-1.5"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Form to add new type */}
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/20 space-y-4">
          <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-neutral-400">
            Define New Object Type
          </h4>
          <form action={formAction} onSubmit={handleCreateType} className="space-y-4">
            <input type="hidden" name="selectedIcon" value={selectedIcon} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                  Object Type Name
                </label>
                <input
                  type="text"
                  name="typeName"
                  placeholder="e.g. Restaurant, Paper, Client"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="w-full bg-white border border-neutral-200 focus:border-neutral-400 rounded p-2 text-xs font-sys outline-none shadow-sm placeholder:text-neutral-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                  Selected Icon
                </label>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-neutral-100 border border-neutral-200 rounded font-bold text-neutral-600 flex items-center justify-center h-8 w-8 shrink-0">
                    <CustomLucideIcon name={selectedIcon} className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest truncate">
                    {selectedIcon}
                  </span>
                </div>
              </div>
            </div>

            {/* Icon Picker list */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Assign Custom Icon
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 p-2.5 bg-neutral-50/50 border border-neutral-200 rounded max-h-[105px] overflow-y-auto custom-scrollbar">
                {AVAILABLE_ICONS.map((iconName) => {
                  const isSel = selectedIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-1.5 hover:bg-neutral-100 rounded text-neutral-500 flex items-center justify-center transition-all cursor-pointer border ${
                        isSel
                          ? 'bg-white border-neutral-400 text-neutral-950 scale-105'
                          : 'border-transparent'
                      }`}
                      title={iconName}
                    >
                      <CustomLucideIcon name={iconName} className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {state.error && <p className="text-xs text-red-500 font-bold">{state.error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 bg-neutral-900 text-white rounded font-sys text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>{isPending ? 'CREATING...' : 'CREATE OBJECT TYPE'}</span>
            </button>
          </form>
        </div>

        {/* Existing types list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-neutral-400">
            Current Schema Directory
          </h4>
          <div className="space-y-2">
            {(objectTypes || []).map((type) => {
              const systemTypes = ['page', 'note', 'person', 'project', 'book', 'task'];
              const isSystem = systemTypes.includes(type.id);
              const isEditing = editingTypeId === type.id;
              const associatedDocsCount = (documents || []).filter(
                (doc) => doc.typeId === type.id
              ).length;

              return (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 border border-neutral-200/70 bg-white hover:bg-neutral-50/30 transition-all rounded"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative group/change">
                      <div className="p-2 bg-neutral-100 border border-neutral-100 rounded text-neutral-600 flex items-center justify-center w-8 h-8 shrink-0">
                        <CustomLucideIcon name={type.icon || 'Layers'} className="w-4 h-4" />
                      </div>
                      {/* Icon switcher dropdown overlay for convenience */}
                      <button className="absolute inset-0 bg-black/40 backdrop-blur-xs text-white opacity-0 group-hover/change:opacity-100 flex items-center justify-center rounded text-[10px] font-mono font-bold transition-opacity cursor-pointer">
                        SET
                        <select
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          value={type.icon || 'Layers'}
                          onChange={(e) => handleUpdateIcon(type.id, e.target.value)}
                        >
                          {AVAILABLE_ICONS.map((ic) => (
                            <option key={ic} value={ic}>
                              {ic}
                            </option>
                          ))}
                        </select>
                      </button>
                    </div>

                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-white border border-neutral-300 rounded px-2 py-0.5 text-xs font-sys outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(type.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded border-none bg-transparent cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-sys text-xs font-bold text-neutral-900 capitalize">
                            {type.name}
                          </span>
                          <span className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">
                            ({type.id})
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {isSystem ? 'System Standard' : 'Custom Schema'} // {associatedDocsCount}{' '}
                        Cards Compiled
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(type.id, type.name)}
                        className="p-1 px-2 border border-neutral-200 hover:border-neutral-300 hover:text-black rounded text-[10px] font-semibold cursor-pointer text-neutral-500 bg-white hover:bg-neutral-50"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isSystem && (
                      <button
                        onClick={() => handleDeleteType(type.id)}
                        disabled={associatedDocsCount > 0}
                        className={`p-1 px-2 border rounded text-[10px] font-semibold transition-all ${
                          associatedDocsCount > 0
                            ? 'border-neutral-100 text-neutral-300 cursor-not-allowed bg-neutral-50'
                            : 'border-red-100 text-red-600 hover:border-red-300 hover:bg-red-50 cursor-pointer bg-white'
                        }`}
                        title={
                          associatedDocsCount > 0
                            ? 'Cannot delete: assigned to active cards'
                            : 'Delete Object Type'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
