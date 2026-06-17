import type { FC } from 'react';
import { useState } from 'react';
import { saveAs } from 'file-saver';
import { Alert, Button } from '@patternfly/react-core';
import { RhUiDownloadIcon } from '@patternfly/react-icons';
import { coFetch } from '@console/shared/src/utils/console-fetch';

export const DownloadButton: FC<DownloadButtonProps> = (props) => {
  const [inFlight, setInFlight] = useState(false);
  const [error, setError] = useState(null);

  const download = () => {
    setInFlight(true);
    setError(false);

    coFetch(props.url, {}, 30000)
      .then((response) => response.blob())
      .then((blob) => saveAs(blob, props.filename))
      .then(
        () => setError(null),
        (e) => setError(e),
      )
      .then(() => setInFlight(false));
  };

  return (
    <>
      <Button
        icon={<RhUiDownloadIcon />}
        variant="primary"
        style={{ marginBottom: 10 }}
        isDisabled={inFlight}
        type="button"
        onClick={() => download()}
      >
        Download{inFlight && <>ing...</>}
      </Button>
      {error && (
        <Alert
          isInline
          className="co-alert co-break-word"
          variant="danger"
          title={error.toString()}
        />
      )}
    </>
  );
};

export type DownloadButtonProps = {
  url: string;
  filename?: string;
  className?: string;
};

DownloadButton.displayName = 'DownloadButton';
