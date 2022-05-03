import * as React from 'react';
import * as _ from 'lodash-es';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import { Button, CodeBlock, CodeBlockAction, CodeBlockCode, Tooltip } from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export const CopyToClipboard: React.FC<CopyToClipboardProps> = React.memo((props) => {
  const [copied, setCopied] = React.useState(false);

  const { t } = useTranslation();
  const tooltipText = copied ? t('public~Copied') : t('public~Copy to clipboard');
  const tooltipContent = [
    <span className="co-nowrap" key="nowrap">
      {tooltipText}
    </span>,
  ];

  // Default to value if no visible value was specified.
  const visibleValue = _.isNil(props.visibleValue) ? props.value : props.visibleValue;

  const actions = (
    <CodeBlockAction>
      <Tooltip content={tooltipContent} trigger="click mouseenter focus" exitDelay={1250}>
        <CTC text={props.value} onCopy={() => setCopied(true)}>
          <Button
            variant="plain"
            onMouseEnter={() => setCopied(false)}
            className="co-copy-to-clipboard__btn"
            type="button"
          >
            <CopyIcon />
            <span className="sr-only">{t('public~Copy to clipboard')}</span>
          </Button>
        </CTC>
      </Tooltip>
    </CodeBlockAction>
  );

  return (
    <CodeBlock actions={actions} className="co-copy-to-clipboard">
      <CodeBlockCode className="co-copy-to-clipboard__text" data-test="copy-to-clipboard">
        {visibleValue}
      </CodeBlockCode>
    </CodeBlock>
  );
});

export type CopyToClipboardProps = {
  value: string;
  visibleValue?: React.ReactNode;
};

CopyToClipboard.displayName = 'CopyToClipboard';
