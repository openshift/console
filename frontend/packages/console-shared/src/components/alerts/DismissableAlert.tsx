import * as React from 'react';
import { Alert, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core';

export const DismissableAlert = ({ title, children, variant }: DismissableAlertProps) => {
  const [show, setShow] = React.useState(true);
  return show ? (
    <Alert
      isInline
      variant={variant}
      title={title}
      actionClose={<AlertActionCloseButton onClose={() => setShow(false)} />}
    >
      {children}
    </Alert>
  ) : null;
};

type DismissableAlertProps = {
  title: string;
  children: React.ReactNode;
  variant?: AlertVariant;
};
