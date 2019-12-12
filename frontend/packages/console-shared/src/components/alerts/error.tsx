import * as React from 'react';
import { Alert } from '@patternfly/react-core';

const ErrorAlert: React.FC<Props> = ({ message, title = 'An error occurred' }) => (
  <Alert isInline className="co-alert co-alert--scrollable" title={title} variant="danger">
    {message}
  </Alert>
);

type Props = {
  message: string;
  title?: string;
};

export default ErrorAlert;
