import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import * as classnames from 'classnames';
import { LoadingInline } from '@console/internal/components/utils';
import { PopoverStatus, ValidationErrorType, StatusIconAndText } from '@console/shared';
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
  const [isActive, setActive] = React.useState(false);
  const onHide = React.useCallback(() => setActive(false), [setActive]);
  const onShow = React.useCallback(() => setActive(true), [setActive]);
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
    >
      {help && (
        <span className="kubevirt-form-row__icon-status-container">
          <PopoverStatus
            title={`${fieldId} help`}
            hideHeader
            onHide={onHide}
            onShow={onShow}
            statusBody={
              <StatusIconAndText
                title={`${fieldId} help`}
                iconOnly
                icon={
                  <HelpIcon
                    className={classnames({ 'kubevirt-form-row__help-icon--hidden': !isActive })}
                  />
                }
              />
            }
          >
            {help}
          </PopoverStatus>
        </span>
      )}
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
