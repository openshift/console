import * as React from 'react';
import * as _ from 'lodash-es';

import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import { Tooltip } from 'react-lightweight-tooltip';

export class CopyToClipboard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {copied: false};
    this.showCopied = this.showCopied.bind(this);
    this.showDefault = this.showDefault.bind(this);
  }

  showCopied() {
    this.setState({copied: true});
  }

  showDefault() {
    this.setState({copied: false});
  }

  render() {
    // Use custom styles for this tooltip to position it to the left.
    const overrides = Object.freeze({
      wrapper: {
        position: 'absolute',
        right: '0',
        top: '0',
        height: '42px',
        padding: '0',
      },
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
      },
      content: {
        display: 'block',
        fontFamily: '"Open Sans",Helvetica,Arial,sans-serif',
        fontSize: '12px',
        padding: '7px 12px',
        whiteSpace: 'normal',
      },
      arrow: {
        position: 'absolute',
        bottom: '8px',
        right: '-13px',
        left: 'auto',
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderLeft: '8px solid #000',
      }
    });

    const tooltipText = this.state.copied ? 'Copied' : 'Copy to Clipboard';
    const tooltipContent = [<span className="co-nowrap" key="nowrap">{tooltipText}</span>];

    // Default to value if no visible value was specified.
    const visibleValue = _.isNil(this.props.visibleValue) ? this.props.value : this.props.visibleValue;

    return <div className="co-copy-to-clipboard">
      <pre className="co-pre-wrap co-copy-to-clipboard__text">{visibleValue}</pre>
      <Tooltip content={tooltipContent} styles={overrides}>
        <CTC text={this.props.value} onCopy={this.showCopied}>
          <button onMouseEnter={this.showDefault} className="btn btn-default co-copy-to-clipboard__btn fix" type="button">
            <i className="fa fa-clipboard" aria-hidden="true"></i>
            <span className="sr-only">Copy to Clipboard</span>
          </button>
        </CTC>
      </Tooltip>
    </div>;
  }
}
