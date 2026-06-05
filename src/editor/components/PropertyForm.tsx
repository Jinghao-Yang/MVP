import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { toast } from 'sonner';
import { Tag, Calendar, User, FileText, ChevronRight, Hash, Link2, BookOpen } from 'lucide-react';

interface PropertyFormProps {
  docId: string;
}

export function PropertyForm({ docId }: PropertyFormProps) {
  const doc = useLiveQuery(() => db.documents.get(docId), [docId]);
  const objectTypes = useLiveQuery(() => db.objectTypes.toArray(), []);

  // Load list of all other docs for relational reference matching
  const allDocs = useLiveQuery(() => db.documents.toArray(), []);

  // Determine current type id (fallback to 'page')
  const currentTypeId = doc?.typeId || 'page';

  // Load properties representing the active ObjectType template
  const properties = useLiveQuery(
    () => db.properties.where('typeId').equals(currentTypeId).toArray(),
    [currentTypeId]
  );

  // Load current values of properties for this document
  const docProperties = useLiveQuery(
    () => db.docProperties.where('docId').equals(docId).toArray(),
    [docId]
  );

  // Load active object relations (relational link tables)
  const relations = useLiveQuery(
    () => db.relations.where('sourceId').equals(docId).toArray(),
    [docId]
  );

  const [formState, setFormState] = useState<Record<string, string>>({});

  useEffect(() => {
    if (docProperties) {
      const state: Record<string, string> = {};
      docProperties.forEach((p) => {
        state[p.propId] = p.value;
      });
      setFormState(state);
    }
  }, [docProperties]);

  if (!doc) return null;

  // Handle converting object type (Page -> Person -> Project -> Book)
  const handleTypeChange = async (newTypeId: string) => {
    try {
      await db.documents.update(docId, { typeId: newTypeId });
      toast.success(`Converted to Object Type: ${newTypeId.toUpperCase()}`);
    } catch {
      toast.error('Failed to change document type.');
    }
  };

  // Sync general property input field
  const handlePropertyChange = async (propId: string, value: string) => {
    setFormState((prev) => ({ ...prev, [propId]: value }));
    try {
      await db.docProperties.put({
        docId,
        propId,
        value,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Sync relational entity selection
  const handleRelationChange = async (propId: string, targetId: string) => {
    try {
      // Clear previous relations matching this property definition for the document
      await db.relations
        .where('sourceId')
        .equals(docId)
        .and((r) => r.propId === propId)
        .delete();

      if (targetId) {
        await db.relations.add({
          sourceId: docId,
          propId,
          targetId,
        });
        toast.info('Relation linked!');
      } else {
        toast.info('Relation cleared!');
      }
    } catch {
      toast.error('Failed to update relational link');
    }
  };

  const getPropIcon = (dataType: string) => {
    switch (dataType) {
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-neutral-400" />;
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-neutral-400" />;
      case 'relation':
        return <Link2 className="w-3.5 h-3.5 text-neutral-400 font-bold text-bh-blue" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="border border-neutral-200/60 bg-neutral-50/50 p-5 rounded-2xl space-y-4 mb-4 select-none">
      {/* Object Type Selector Row */}
      <div className="flex items-center justify-between border-b border-neutral-200/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-neutral-200/40 rounded-lg text-neutral-700">
            {currentTypeId === 'person' && <User className="w-4 h-4 text-neutral-500" />}
            {currentTypeId === 'book' && <BookOpen className="w-4 h-4 text-neutral-500" />}
            {currentTypeId === 'page' && <FileText className="w-4 h-4 text-neutral-500" />}
            {currentTypeId === 'project' && <Tag className="w-4 h-4 text-neutral-500" />}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-400">
            Object Type
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <select
            value={currentTypeId}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="bg-transparent border-none font-sans font-bold text-sm text-[var(--text-main)] outline-none cursor-pointer hover:text-neutral-900 transition-colors"
          >
            {objectTypes?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <span className="font-mono text-[9px] uppercase tracking-wider font-semibold text-neutral-400 bg-neutral-200/30 px-2.5 py-1 rounded">
          Normalized Capacities Meta
        </span>
      </div>

      {/* Dynamic Property Form Fields */}
      {properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {properties.map((prop) => {
            const val = formState[prop.id] || '';
            const isRelation = prop.dataType === 'relation';

            // Find current relation target if this is a relation
            const relationTarget = relations?.find((r) => r.propId === prop.id)?.targetId || '';

            return (
              <div key={prop.id} className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-400">
                  {getPropIcon(prop.dataType)}
                  <span>{prop.name}</span>
                </label>

                {isRelation ? (
                  <select
                    value={relationTarget}
                    onChange={(e) => handleRelationChange(prop.id, e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 font-sys text-xs outline-none focus:border-neutral-400 transition-colors"
                  >
                    <option value="">-- Associate Document --</option>
                    {allDocs
                      ?.filter((d) => d.id !== docId) // Don't allow linking to oneself
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} ({d.typeId?.toUpperCase() || 'PAGE'})
                        </option>
                      ))}
                  </select>
                ) : prop.dataType === 'date' ? (
                  <input
                    type="date"
                    value={val}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none focus:border-neutral-400 transition-colors"
                  />
                ) : prop.dataType === 'number' ? (
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    placeholder="Enter threshold numeric value..."
                    className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 font-sys text-xs outline-none focus:border-neutral-400 transition-colors font-mono"
                  />
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    placeholder={`Enter ${prop.name}...`}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 font-sys text-xs outline-none focus:border-neutral-400 transition-colors"
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-neutral-400 font-mono italic">
          No properties declared for this object definition.
        </p>
      )}
    </div>
  );
}
