import * as React from 'react';
import { ActionGroup, Alert, Button, ButtonVariant } from '@patternfly/react-core';
import { ButtonBar } from '@console/internal/components/utils';
import { FormFooterProps } from './form-utils-types';

const FormFooter: React.FC<FormFooterProps> = ({
  handleSubmit,
  handleReset,
  handleCancel,
  submitLabel = 'Save',
  resetLabel = 'Reload',
  cancelLabel = 'Cancel',
  infoTitle = 'You made changes to this page.',
  infoMessage = `Click ${submitLabel} to save changes or ${resetLabel} to cancel changes.`,
  isSubmitting,
  errorMessage,
  successMessage,
  disableSubmit,
  showAlert,
}) => (
  <ButtonBar inProgress={isSubmitting} errorMessage={errorMessage} successMessage={successMessage}>
    {showAlert && (
      <Alert isInline className="co-alert" variant="info" title={infoTitle}>
        {infoMessage}
      </Alert>
    )}
    <ActionGroup className="pf-c-form">
      <Button
        type={handleSubmit ? 'button' : 'submit'}
        {...(handleSubmit && { onClick: handleSubmit })}
        variant={ButtonVariant.primary}
        isDisabled={disableSubmit}
      >
        {submitLabel}
      </Button>
      {handleReset && (
        <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
          {resetLabel}
        </Button>
      )}
      {handleCancel && (
        <Button type="button" variant={ButtonVariant.secondary} onClick={handleCancel}>
          {cancelLabel}
        </Button>
      )}
    </ActionGroup>
  </ButtonBar>
);

export default FormFooter;
