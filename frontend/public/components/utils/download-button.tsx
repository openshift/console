import * as React from 'react';
import { saveAs } from 'file-saver';

import { coFetch } from '../../co-fetch';
import { SafetyFirst } from '../safety-first';

const spanStyle = {
  position: 'absolute' as 'absolute',
  left: 0,
};

export class DownloadButton extends SafetyFirst<DownloadButtonProps, DownloadButtonState> {
  constructor (props) {
    super(props);
    this.state = {
      inFlight: false,
      error: null,
    };
  }

  download () {
    const { filename, url } = this.props;
    this.setState({inFlight: true, error: null});
    // Increase default timeout to 30 seconds.
    coFetch(url, {}, 30000)
      .then(response => response.blob())
      .then(blob => saveAs(blob, filename))
      .then(
        () => this.setState({error: null}),
        e => this.setState({error: e})
      )
      .then(() => this.setState({inFlight: false}));
  }

  render () {
    const { className, filename } = this.props;
    const { error, inFlight } = this.state;
    // The position styling and always-hidden filename are so the button doesn't resize when its content changes.
    return <div className={className}>
      <button className="btn btn-primary" style={{marginBottom: 10}} disabled={inFlight} type="button" onClick={() => this.download()}>
        <i className="fa fa-fw fa-download" />&nbsp;Download
        <span style={{position: 'relative'}}>
          { inFlight && <span style={spanStyle}>ing...</span> }
          <span style={Object.assign({}, spanStyle, {visibility: inFlight ? 'hidden' : 'visible'})}>&nbsp;{filename}</span>
        </span>
        <span style={{visibility: 'hidden'}}>&nbsp;{filename}</span>
      </button>
      { error && <p className="alert alert-danger" style={{wordBreak: 'break-word'}}><span className="pficon pficon-error-circle-o"></span>{error.toString()}</p> }
    </div>;
  }
}

/* eslint-disable no-undef */
export type DownloadButtonProps = {
  url: string,
  filename?: string,
  className?: string,
};

export type DownloadButtonState = {
  inFlight: boolean,
  error: any,
};
/* eslint-enable no-undef */
