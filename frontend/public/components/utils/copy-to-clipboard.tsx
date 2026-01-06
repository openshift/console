import type { FC, ReactNode } from 'react';
import { memo, useState } from 'react';
import * as _ from 'lodash';
import {
  ClipboardCopyButton,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const CopyToClipboard: FC<CopyToClipboardProps> = memo(
  ({ value, visibleValue, id = 'id' }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    const clipboardCopyFunc = (event, text) => {
      navigator.clipboard.writeText(text.toString());
    };
    const onClick = (event, text) => {
      clipboardCopyFunc(event, text);
      setCopied(true);
    };

    const copyToClipboardText = t('public~Copy to clipboard');
    const tooltipText = copied ? t('public~Copied') : copyToClipboardText;
    // Default to value if no visible value was specified.
    const displayValue = _.isNil(visibleValue) ? value : visibleValue;

    const actions = (
      <CodeBlockAction>
        <ClipboardCopyButton
          id={`clipboard-copy-button-${id}`}
          textId={`code-content-${id}`}
          aria-label={copyToClipboardText}
          onClick={(e) => onClick(e, value)}
          exitDelay={copied ? 1250 : 600}
          variant="plain"
          onTooltipHidden={() => setCopied(false)}
        >
          {tooltipText}
        </ClipboardCopyButton>
      </CodeBlockAction>
    );

    return (
      <CodeBlock actions={actions} className="co-copy-to-clipboard">
        <CodeBlockCode
          className="co-copy-to-clipboard__text"
          data-test="copy-to-clipboard"
          codeClassName="co-copy-to-clipboard__code"
          id={`code-content-${id}`}
        >
          {displayValue}
        </CodeBlockCode>
      </CodeBlock>
    );
  },
);

export type CopyToClipboardProps = {
  value: string;
  visibleValue?: ReactNode;
  id?: string;
};

CopyToClipboard.displayName = 'CopyToClipboard';
