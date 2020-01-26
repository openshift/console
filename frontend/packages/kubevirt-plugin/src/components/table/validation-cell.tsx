import * as React from 'react';
import * as classNames from 'classnames';
import { ValidationErrorType, ValidationObject } from '@console/shared';

import './validation-cell.scss';

export type SimpleCellProps = {
  children?: React.ReactNode;
  validation?: ValidationObject;
};

export const ValidationCell: React.FC<SimpleCellProps> = ({ children, validation }) => {
  return (
    <>
      {children}
      {validation && (
        <div
          className={classNames({
            'kubevirt-validation-cell__cell--error': [
              ValidationErrorType.Error,
              ValidationErrorType.TrivialError,
            ].includes(validation.type),
            'kubevirt-validation-cell__cell--warning': validation.type === ValidationErrorType.Warn,
          })}
        >
          {validation.message}
        </div>
      )}
    </>
  );
};
