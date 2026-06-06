import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { useMemo } from 'react';
import { TASK_STATUS, PRIORITY_LEVELS } from '@/utils/constants';

export interface ObjectTask {
  id: string;
  title: string;
  typeId: string;
  status: string;
  duedate: string | null;
  priority: string;
  content: string;
}

export function useTasks() {
  const documents = useLiveQuery(() => db.documents.toArray());
  const docProperties = useLiveQuery(() => db.docProperties.toArray());
  const inlineTasks = useLiveQuery(() => db.inlineTasks.toArray()) || [];

  const objectTasks = useMemo(() => {
    if (!documents || !docProperties) return [];

    const propsMap: Record<string, Record<string, string>> = {};
    docProperties.forEach((p) => {
      if (!propsMap[p.docId]) propsMap[p.docId] = {};
      propsMap[p.docId][p.propId] = p.value;
    });

    const list: ObjectTask[] = [];

    documents.forEach((doc) => {
      if (doc.typeId === 'task' || doc.typeId === 'project') {
        const p = propsMap[doc.id] || {};
        const isProject = doc.typeId === 'project';

        const status = isProject
          ? p['prop-proj-status'] || 'Active'
          : p['prop-task-status'] || TASK_STATUS.TODO;

        const duedate = isProject ? p['prop-proj-duedate'] || null : p['prop-task-duedate'] || null;
        const priority = isProject
          ? PRIORITY_LEVELS.HIGH
          : p['prop-task-priority'] || PRIORITY_LEVELS.MEDIUM;

        list.push({
          id: doc.id,
          title: doc.title,
          typeId: doc.typeId,
          status,
          duedate,
          priority,
          content: doc.content,
        });
      }
    });

    return list;
  }, [documents, docProperties]);

  return {
    objectTasks,
    inlineTasks,
    isLoading: !documents || !docProperties,
  };
}
