import * as React from 'react';
import * as cx from 'classnames';
import { ActionGroup, Alert, Button, ButtonVariant } from '@patternfly/react-core';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import { ButtonBar } from '@console/internal/components/utils';
import { FormFooterProps, FormFooterVariant } from './form-utils-types';
import './FormFooter.scss';

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
  sticky,
  formFooterVariant = FormFooterVariant.Default,
}) => {
  const renderButtonsWithIcons = () => (
    <ActionGroup className="pf-c-form pf-c-form__actions--right">
      <Button
        type={handleSubmit ? 'button' : 'submit'}
        {...(handleSubmit && { onClick: handleSubmit })}
        variant={ButtonVariant.plain}
        isDisabled={disableSubmit}
        data-test-id="check-icon"
        style={{ padding: '0px' }}
      >
        <CheckIcon />
      </Button>
      {handleReset && (
        <Button
          type="button"
          data-test-id="reset-icon"
          variant={ButtonVariant.plain}
          onClick={handleReset}
          style={{ padding: '0px' }}
        >
          <CloseIcon />
        </Button>
      )}
      {handleCancel && (
        <Button
          type="button"
          data-test-id="close-icon"
          variant={ButtonVariant.plain}
          onClick={handleCancel}
          style={{ padding: '0px' }}
        >
          <CloseIcon />
        </Button>
      )}
    </ActionGroup>
  );

  const renderButtonsWithLabels = () => (
    <ActionGroup className="pf-c-form pf-c-form__group--no-top-margin">
      <Button
        type={handleSubmit ? 'button' : 'submit'}
        {...(handleSubmit && { onClick: handleSubmit })}
        variant={ButtonVariant.primary}
        isDisabled={disableSubmit}
        data-test-id="submit-button"
      >
        {submitLabel}
      </Button>
      {handleReset && (
        <Button
          type="button"
          data-test-id="reset-button"
          variant={ButtonVariant.secondary}
          onClick={handleReset}
        >
          {resetLabel}
        </Button>
      )}
      {handleCancel && (
        <Button
          type="button"
          data-test-id="cancel-button"
          variant={ButtonVariant.secondary}
          onClick={handleCancel}
        >
          {cancelLabel}
        </Button>
      )}
    </ActionGroup>
  );

  return (
    <ButtonBar
      className={cx('ocs-form-footer', {
        'ocs-form-footer__sticky': sticky,
      })}
      inProgress={isSubmitting}
      errorMessage={errorMessage}
      successMessage={successMessage}
    >
      {showAlert && (
        <Alert isInline className="co-alert" variant="info" title={infoTitle}>
          {infoMessage}
        </Alert>
      )}
      {formFooterVariant === FormFooterVariant.Icons
        ? renderButtonsWithIcons()
        : renderButtonsWithLabels()}
    </ButtonBar>
  );
};

export default FormFooter;
