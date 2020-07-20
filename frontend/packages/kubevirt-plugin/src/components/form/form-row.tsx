import * as React from 'react';
import { FormGroup, Popover, PopoverPosition } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { LoadingInline } from '@console/internal/components/utils';
import { ValidationErrorType } from '@console/shared';

import './form-row.scss';

export const FormRow: React.FC<FormRowProps> = ({
  fieldId,
  title,
  help,
  isHidden,
  isRequired,
  isLoading,
  validationMessage,
  validationType,
  validation,
  children,
  className,
}) => {
  if (isHidden) {
    return null;
  }
  const type = (validation && validation.type) || validationType;
  const message = (validation && validation.message) || validationMessage;

  return (
    <FormGroup
      label={title}
      isRequired={isRequired}
      fieldId={fieldId}
      validated={type !== ValidationErrorType.Error ? 'default' : 'error'}
      helperTextInvalid={type === ValidationErrorType.Error ? message : undefined}
      helperText={
        type === ValidationErrorType.Info || type === ValidationErrorType.Warn ? message : undefined
      }
      className={className}
      labelIcon={
        help && (
          <Popover
            position={PopoverPosition.right}
            aria-label={`${fieldId} help`}
            bodyContent={help}
          >
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="pf-c-form__group-label-help"
              aria-label={`${fieldId} help`}
            >
              <HelpIcon noVerticalAlign />
            </button>
          </Popover>
        )
      }
    >
      {isLoading && (
        <span className="kubevirt-form-row__loading-container">
          <LoadingInline />
        </span>
      )}
      {children}
    </FormGroup>
  );
};

type FormRowProps = {
  fieldId: string;
  title?: string;
  help?: React.ReactNode;
  helpTitle?: string;
  isHidden?: boolean;
  isRequired?: boolean;
  isLoading?: boolean;
  validationMessage?: string;
  validationType?: ValidationErrorType;
  validation?: {
    message?: string;
    type?: ValidationErrorType;
  };
  children?: React.ReactNode;
  className?: string;
};
