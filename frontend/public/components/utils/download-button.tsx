import * as React from 'react';
import { saveAs } from 'file-saver';

import { coFetch } from '../../co-fetch';
import { SafetyFirst } from '../safety-first';

const buttonStyle = {
  marginBottom: 10,
  maxWidth: 300,
  textOverflow: 'ellipsis',
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
    coFetch(url)
      .then(response => response.blob()
        .then(blob => saveAs(blob, filename)))
      .then(() => this.setState({error: null}))
      .catch(e => this.setState({error: e}))
      .then(() => this.setState({inFlight: false}));
  }

  render () {
    const { filename } = this.props;
    const { error, inFlight } = this.state;
    return <div>
      <button className="btn btn-primary" style={buttonStyle} disabled={inFlight} type="button" onClick={() => this.download()}>
        <i className="fa fa-fw fa-download" />&nbsp;Download
        <span style={{position: 'relative'}}>
          { inFlight && <span style={{position: 'absolute', left: 0}}>ing...</span> }
          <span style={{position: 'absolute', left: 0, visibility: inFlight ? 'hidden' : 'visible'}}>&nbsp;{filename}</span>
        </span>
        <span style={{visibility: 'hidden'}}>&nbsp;{filename}</span>
      </button>
      { error && <p className="alert text-danger bg-danger" style={{wordBreak: 'break-word'}}>{error.toString()}</p> }
    </div>;
  }
}

/* eslint-disable no-undef */
export type DownloadButtonProps = {
  url: string,
  filename?: string,
};

export type DownloadButtonState = {
  inFlight: boolean,
  error: any,
};
/* eslint-enable no-undef */
