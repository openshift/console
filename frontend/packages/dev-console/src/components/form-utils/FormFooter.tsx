import * as React from 'react';
import { ActionGroup, Alert, Button, ButtonVariant } from '@patternfly/react-core';
import { ButtonBar } from '@console/internal/components/utils';
import { FormFooterProps } from './form-utils-types';

const FormFooter: React.FC<FormFooterProps> = ({
  handleSubmit,
  handleReset,
  isSubmitting,
  errorMessage,
  successMessage,
  disableSubmit,
  showAlert,
}) => (
  <ButtonBar inProgress={isSubmitting} errorMessage={errorMessage} successMessage={successMessage}>
    {showAlert && (
      <Alert isInline className="co-alert" variant="info" title="You made changes to this page.">
        Click Save to save changes or Reload to cancel.
      </Alert>
    )}
    <ActionGroup className="pf-c-form">
      <Button
        type={handleSubmit ? 'button' : 'submit'}
        {...handleSubmit && { onClick: handleSubmit }}
        variant={ButtonVariant.primary}
        isDisabled={disableSubmit}
      >
        Save
      </Button>
      <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
        Reload
      </Button>
    </ActionGroup>
  </ButtonBar>
);

export default FormFooter;
