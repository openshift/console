import * as React from 'react';
import { saveAs } from 'file-saver';
import { Alert } from '@patternfly/react-core';

import { coFetch } from '../../co-fetch';

export const DownloadButton: React.FC<DownloadButtonProps> = (props) => {
  const [inFlight, setInFlight] = React.useState(false);
  const [error, setError] = React.useState(null);

  const download = () => {
    setInFlight(true);
    setError(false);

    coFetch(props.url, {}, 30000)
      .then(response => response.blob())
      .then(blob => saveAs(blob, props.filename))
      .then(
        () => setError(null),
        e => setError(e)
      )
      .then(() => setInFlight(false));
  };

  const { className, filename } = props;
  const spanStyle = {
    position: 'absolute' as 'absolute',
    left: 0,
  };
  // The position styling and always-hidden filename are so the button doesn't resize when its content changes.
  return <div className={className}>
    <button className="btn btn-primary" style={{marginBottom: 10}} disabled={inFlight} type="button" onClick={() => download()}>
      <i className="fa fa-fw fa-download" />&nbsp;Download
      <span style={{position: 'relative'}}>
        { inFlight && <span style={spanStyle}>ing...</span> }
        <span style={Object.assign({}, spanStyle, {visibility: inFlight ? 'hidden' : 'visible'})}>&nbsp;{filename}</span>
      </span>
      <span style={{visibility: 'hidden'}}>&nbsp;{filename}</span>
    </button>
    { error && <Alert isInline className="co-alert co-break-word" variant="danger" title="An error occurred">{error.toString()}</Alert> }
  </div>;
};

export type DownloadButtonProps = {
  url: string,
  filename?: string,
  className?: string,
};

export type DownloadButtonState = {
  inFlight: boolean,
  error: any,
};

DownloadButton.displayName = 'DownloadButton';
