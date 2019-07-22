import * as React from 'react';
import { saveAs } from 'file-saver';
import { Alert, Button } from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons';

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
    <Button variant="primary" style={{marginBottom: 10}} isDisabled={inFlight} type="button" onClick={() => download()}>
      <DownloadIcon /> Download{inFlight && <React.Fragment>ing...</React.Fragment>}
    </Button>
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
