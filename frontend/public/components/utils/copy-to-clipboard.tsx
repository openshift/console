import * as React from 'react';
import * as _ from 'lodash-es';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import { Button, Tooltip } from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';

export const CopyToClipboard: React.FC<CopyToClipboardProps> = React.memo((props) => {
  const [copied, setCopied] = React.useState(false);

  const tooltipText = copied ? 'Copied' : 'Copy to Clipboard';
  const tooltipContent = [
    <span className="co-nowrap" key="nowrap">
      {tooltipText}
    </span>,
  ];

  // Default to value if no visible value was specified.
  const visibleValue = _.isNil(props.visibleValue) ? props.value : props.visibleValue;

  return (
    <div className="co-copy-to-clipboard">
      <pre className="co-pre-wrap co-copy-to-clipboard__text">{visibleValue}</pre>
      <Tooltip content={tooltipContent} trigger="click mouseenter focus" exitDelay={1250}>
        <CTC text={props.value} onCopy={() => setCopied(true)}>
          <Button
            variant="plain"
            onMouseEnter={() => setCopied(false)}
            className="co-copy-to-clipboard__btn pf-c-clipboard-copy__group-copy"
            type="button"
          >
            <CopyIcon />
            <span className="sr-only">Copy to Clipboard</span>
          </Button>
        </CTC>
      </Tooltip>
    </div>
  );
});

export type CopyToClipboardProps = {
  value: string;
  visibleValue?: React.ReactNode;
};

CopyToClipboard.displayName = 'CopyToClipboard';
