import * as React from 'react';
import * as _ from 'lodash-es';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import { Tooltip } from 'react-lightweight-tooltip';

export const CopyToClipboard: React.FC<CopyToClipboardProps> = React.memo((props) => {
  const overrides = Object.freeze({
    wrapper: {
      position: 'absolute',
      right: '0',
      top: '0',
      height: '42px',
      padding: '0',
    } as React.CSSProperties,
    tooltip: {
      position: 'absolute',
      right: '55px',
      bottom: '-6px',
      left: 'auto',
      maxWidth: '170px',
      minWidth: 'auto',
      padding: '0',
      textAlign: 'center',
      width: 'auto',
      transform: 'translateX(0px)',
    } as React.CSSProperties,
    content: {
      display: 'block',
      fontFamily: '"Open Sans",Helvetica,Arial,sans-serif',
      fontSize: '12px',
      padding: '7px 12px',
      whiteSpace: 'normal',
    } as React.CSSProperties,
    arrow: {
      position: 'absolute',
      bottom: '8px',
      right: '-13px',
      left: 'auto',
      borderTop: '8px solid transparent',
      borderBottom: '8px solid transparent',
      borderLeft: '8px solid #000',
    } as React.CSSProperties,
    gap: {},
  });

  const [copied, setCopied] = React.useState(false);

  const tooltipText = copied ? 'Copied' : 'Copy to Clipboard';
  const tooltipContent = [<span className="co-nowrap" key="nowrap">{tooltipText}</span>];

  // Default to value if no visible value was specified.
  const visibleValue = _.isNil(props.visibleValue) ? props.value : props.visibleValue;

  return <div className="co-copy-to-clipboard">
    <pre className="co-pre-wrap co-copy-to-clipboard__text">{visibleValue}</pre>
    <Tooltip content={tooltipContent} styles={overrides}>
      <CTC text={props.value} onCopy={() => setCopied(true)}>
        <button onMouseEnter={() => setCopied(false)} className="btn btn-default co-copy-to-clipboard__btn fix" type="button">
          <i className="fa fa-clipboard" aria-hidden="true"></i>
          <span className="sr-only">Copy to Clipboard</span>
        </button>
      </CTC>
    </Tooltip>
  </div>;
});

export type CopyToClipboardProps = {
  value: string;
  visibleValue?: string;
};

CopyToClipboard.displayName = 'CopyToClipboard';
