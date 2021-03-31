import * as React from 'react';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import {
  MarkdownHighlightExtension,
  MarkdownExecuteSnippet,
  MarkdownCopyClipboard,
  useInlineCopyClipboardShowdownExtension,
  useInlineExecuteCommandShowdownExtension,
  useMultilineCopyClipboardShowdownExtension,
  useMultilineExecuteCommandShowdownExtension,
} from '@console/shared';
import { HIGHLIGHT_REGEXP } from '@console/shared/src/components/markdown-highlight-extension/highlight-consts';

type QuickStartMarkdownViewProps = {
  content: string;
  exactHeight?: boolean;
};

const QuickStartMarkdownView: React.FC<QuickStartMarkdownViewProps> = ({
  content,
  exactHeight,
}) => {
  const inlineCopyClipboardShowdownExtension = useInlineCopyClipboardShowdownExtension();
  const inlineExecuteCommandShowdownExtension = useInlineExecuteCommandShowdownExtension();
  const multilineCopyClipboardShowdownExtension = useMultilineCopyClipboardShowdownExtension();
  const multilineExecuteCommandShowdownExtension = useMultilineExecuteCommandShowdownExtension();
  return (
    <SyncMarkdownView
      inline
      content={content}
      exactHeight={exactHeight}
      extensions={[
        {
          type: 'lang',
          regex: HIGHLIGHT_REGEXP,
          replace: (text: string, linkLabel: string, linkType: string, linkId: string): string => {
            if (!linkLabel || !linkType || !linkId) return text;
            return `<button class="pf-c-button pf-m-inline pf-m-link" data-highlight="${linkId}">${linkLabel}</button>`;
          },
        },
        inlineCopyClipboardShowdownExtension,
        inlineExecuteCommandShowdownExtension,
        multilineCopyClipboardShowdownExtension,
        multilineExecuteCommandShowdownExtension,
      ]}
      renderExtension={(docContext, rootSelector) => (
        <>
          <MarkdownHighlightExtension docContext={docContext} rootSelector={rootSelector} />
          <MarkdownCopyClipboard docContext={docContext} rootSelector={rootSelector} />
          <MarkdownExecuteSnippet docContext={docContext} rootSelector={rootSelector} />
        </>
      )}
    />
  );
};
export default QuickStartMarkdownView;
