import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import * as classNames from 'classnames';

import './errors.scss';

export type Error = {
  message?: string;
  variant?: AlertVariant;
  title: string;
  key?: string;
};

type ErrorsProps = {
  errors: Error[];
  endMargin?: boolean;
};

export const Errors: React.FC<ErrorsProps> = ({ errors, endMargin }) => {
  return (
    <>
      {errors &&
        errors.map(({ message, key, title, variant }, idx, arr) => (
          <Alert
            isInline
            key={key || idx}
            variant={variant || AlertVariant.danger}
            title={title}
            className={classNames({
              'kubevirt-errors__error-group--item': idx !== arr.length - 1,
              'kubevirt-errors__error-group--end ': endMargin && idx === arr.length - 1,
            })}
          >
            {message}
          </Alert>
        ))}
    </>
  );
};
