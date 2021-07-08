import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { ValidationErrorType, ValidationObject } from '@console/shared';

import './validation-cell.scss';

export type SimpleCellProps = {
  children?: React.ReactNode;
  validation?: ValidationObject;
  additionalLabel?: string;
};

export const ValidationCell: React.FC<SimpleCellProps> = ({
  children,
  validation,
  additionalLabel,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div
        className={classNames({
          'kv-validation-cell__cell--row-flex-direction': !!additionalLabel,
        })}
      >
        {children}
        {additionalLabel && (
          <div className="kv-validation-cell__additional-label">{additionalLabel}</div>
        )}
      </div>
      {validation && (
        <div
          className={classNames({
            'kv-validation-cell__cell--error': [
              ValidationErrorType.Error,
              ValidationErrorType.TrivialError,
            ].includes(validation.type),
            'kv-validation-cell__cell--warning': validation.type === ValidationErrorType.Warn,
          })}
        >
          {t(validation.messageKey)}
        </div>
      )}
    </>
  );
};
