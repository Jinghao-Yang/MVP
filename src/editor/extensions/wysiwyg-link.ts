import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import { StateField, type EditorState, type Transaction } from '@codemirror/state';

export interface LinkInfo {
  label: string;
  target: string;
  from: number;
  to: number;
}

const linkDecoration = (from: number, to: number, label: string, target: string) => {
  return Decoration.mark({
    start: from,
    end: to,
    class: 'cm-wysiwyg-link',
    attributes: {
      'data-target': target,
      'data-label': label,
    },
    inclusive: false,
  });
};

const updateDecorations = (state: EditorState): DecorationSet => {
  const text = state.doc.toString();
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  const ranges: Array<{ from: number; to: number; value: Decoration }> = [];

  while ((match = regex.exec(text)) !== null) {
    const line = state.doc.lineAt(match.index);
    const from = line.from + (match.index - line.from);
    const to = from + match[0].length;
    const decoration = linkDecoration(from, to, match[1], match[2]);
    ranges.push({ from, to, value: decoration });
  }

  return Decoration.set(ranges);
};

export const wysiwygLinkField = StateField.define<DecorationSet>({
  create(state: EditorState): DecorationSet {
    return updateDecorations(state);
  },

  update(decorations: DecorationSet, transaction: Transaction): DecorationSet {
    if (transaction.docChanged || transaction.reconfigured) {
      return updateDecorations(transaction.state);
    }
    return decorations.map(transaction.changes);
  },

  provide: (field: StateField<DecorationSet>) => {
    return EditorView.decorations.from(field);
  },
});

export interface LinkEvent {
  type: 'link-click' | 'link-hover' | 'link-leave';
  target: string;
  label: string;
  event?: MouseEvent;
}

export const wysiwygLinkExtension = (onLinkEvent: (event: LinkEvent) => void) => {
  return EditorView.domEventHandlers({
    click: (event, _view) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('cm-wysiwyg-link')) {
        const linkTarget = target.getAttribute('data-target');
        const linkLabel = target.getAttribute('data-label');
        if (linkTarget) {
          event.preventDefault();
          onLinkEvent({
            type: 'link-click',
            target: linkTarget,
            label: linkLabel || '',
            event,
          });
          return true;
        }
      }
      return false;
    },

    mousemove: (event, _view) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('cm-wysiwyg-link')) {
        const linkTarget = target.getAttribute('data-target');
        const linkLabel = target.getAttribute('data-label');
        if (linkTarget) {
          onLinkEvent({
            type: 'link-hover',
            target: linkTarget,
            label: linkLabel || '',
            event,
          });
          return;
        }
      }

      onLinkEvent({ type: 'link-leave', target: '', label: '' });
    },

    mouseleave: () => {
      onLinkEvent({ type: 'link-leave', target: '', label: '' });
    },
  });
};

export const wysiwygLinkExtensions = [wysiwygLinkField];
