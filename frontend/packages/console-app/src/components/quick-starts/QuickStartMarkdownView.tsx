import * as React from 'react';
import { extension } from 'showdown';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { MarkdownHighlightExtension } from '@console/shared';
import { HIGHLIGHT_REGEXP } from '@console/shared/src/components/markdown-highlight-extension/highlight-consts';

const EXTENSION_NAME = 'quickstart';
extension(EXTENSION_NAME, () => {
  return [
    {
      type: 'lang',
      regex: HIGHLIGHT_REGEXP,
      replace: (text: string, linkLabel: string, linkType: string, linkId: string): string => {
        if (!linkLabel || !linkType || !linkId) return text;
        return `<button class="pf-c-button pf-m-inline pf-m-link" data-highlight="${linkId}">${linkLabel}</button>`;
      },
    },
  ];
});

type QuickStartMarkdownViewProps = {
  content: string;
  exactHeight?: boolean;
};

const QuickStartMarkdownView: React.FC<QuickStartMarkdownViewProps> = ({
  content,
  exactHeight,
}) => {
  return (
    <SyncMarkdownView
      inline
      content={content}
      exactHeight={exactHeight}
      extensions={[EXTENSION_NAME]}
      renderExtension={(docContext, rootSelector) => (
        <MarkdownHighlightExtension
          key={content}
          docContext={docContext}
          rootSelector={rootSelector}
        />
      )}
    />
  );
};
export default QuickStartMarkdownView;
