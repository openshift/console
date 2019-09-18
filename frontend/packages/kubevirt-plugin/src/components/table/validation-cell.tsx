import * as React from 'react';
import * as classNames from 'classnames';
import { ValidationErrorType, ValidationObject } from '../../utils/validations/types';

import './validation-cell.scss';

export type SimpleCellProps = {
  children?: React.ReactNode;
  validation?: ValidationObject;
};

export const ValidationCell: React.FC<SimpleCellProps> = ({ children, validation }) => {
  return (
    <>
      {children}
      {validation && validation.type !== ValidationErrorType.TrivialError && (
        <div
          className={classNames({
            'kubevirt-nic-row__cell--error': validation.type === ValidationErrorType.Error,
          })}
        >
          {validation.message}
        </div>
      )}
    </>
  );
};
