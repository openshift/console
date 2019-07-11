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

  return <React.Fragment>
    <button className="btn btn-primary" style={{marginBottom: 10}} disabled={inFlight} type="button" onClick={() => download()}>
      <i className="fa fa-fw fa-download" aria-hidden="true" />&nbsp;Download{inFlight && <React.Fragment>ing...</React.Fragment>}
    </button>
    { error && <Alert isInline className="co-alert co-break-word" variant="danger" title={error.toString()} /> }
  </React.Fragment>;
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
