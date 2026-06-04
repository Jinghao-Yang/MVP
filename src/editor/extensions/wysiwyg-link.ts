/* ================================================
   FILE: src/editor/extensions/wysiwyg-link.ts
   WYSIWYG 链接扩展
   ================================================ */
import {
  Decoration,
  MatchDecorator,
  ViewPlugin,
  WidgetType,
  type ViewUpdate,
  type EditorView,
  type DecorationSet,
} from '@codemirror/view';

// WYSIWYG 链接 Widget
export class WYSIWYGLinkWidget extends WidgetType {
  constructor(
    readonly label: string,
    readonly target: string
  ) {
    super();
  }
  eq(other: WYSIWYGLinkWidget) {
    return other.label === this.label && other.target === this.target;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className =
      'cm-wysiwyg-link font-medium cursor-pointer text-[var(--bh-red)] relative px-0.5';
    span.textContent = this.label;
    span.setAttribute('data-target', this.target);
    return span;
  }
}

const linkMatcher = new MatchDecorator({
  regexp: /\[([^\]]+)\]\(([^)]+)\)/g,
  decoration: (match) => {
    return Decoration.replace({
      widget: new WYSIWYGLinkWidget(match[1], match[2]),
      inclusive: false,
    });
  },
});

export const wysiwygLinkFolderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.getDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.getDecorations(update.view);
      }
    }
    getDecorations(view: EditorView) {
      const builder = linkMatcher.createDeco(view);
      const selection = view.state.selection.main;
      const activeLine = view.state.doc.lineAt(selection.from);

      return builder.update({
        filter: (from) => {
          return from < activeLine.from || from > activeLine.to;
        },
      });
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
