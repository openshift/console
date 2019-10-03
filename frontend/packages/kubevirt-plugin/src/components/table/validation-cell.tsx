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
      {validation && (
        <div
          className={classNames({
            'kubevirt-validation-cell__cell--error': [
              ValidationErrorType.Error,
              ValidationErrorType.TrivialError,
            ].includes(validation.type),
          })}
        >
          {validation.message}
        </div>
      )}
    </>
  );
};
