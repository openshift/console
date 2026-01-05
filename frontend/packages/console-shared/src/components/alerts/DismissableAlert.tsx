import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core';

export const DismissableAlert = ({
  title,
  children,
  variant,
  className,
}: DismissableAlertProps) => {
  const [show, setShow] = useState(true);
  return show ? (
    <Alert
      isInline
      className={className}
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
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
};
