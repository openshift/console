import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import type { AlertVariant } from '@patternfly/react-core';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';

export const DismissableAlert: FC<DismissableAlertProps> = ({
  title,
  children,
  variant,
  className,
}) => {
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
