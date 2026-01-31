import { useState } from 'react';
import { Button, Alert, TextInput, FormGroup } from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
import { useTranslation } from 'react-i18next';
import { ModalComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';

export interface TextInputModalProps {
  title: string;
  label: string;
  initialValue: string;
  onSubmit: (value: string) => void;
  validator?: (value: string) => string | null; // Returns error message or null if valid
  submitButtonText?: string;
  cancelButtonText?: string;
  inputType?: 'text' | 'password' | 'email' | 'url' | 'number';
  placeholder?: string;
  helpText?: string;
}

export const TextInputModal: ModalComponent<TextInputModalProps> = ({
  closeModal,
  title,
  label,
  initialValue,
  onSubmit,
  validator,
  submitButtonText,
  cancelButtonText,
  inputType = 'text',
  placeholder,
  helpText,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const [errorMessage, setErrorMessage] = useState('');

  const submit = (event) => {
    event.preventDefault();

    if (!value) {
      setErrorMessage(t('console-shared~This field is required'));
      return;
    }

    if (validator) {
      const validationError = validator(value);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
    }

    onSubmit(value);
    closeModal();
  };

  return (
    <Modal
      variant={ModalVariant.small}
      title={title}
      isOpen
      onClose={closeModal}
      actions={[
        <Button
          key="confirm-action"
          type="submit"
          variant="primary"
          disabled={!value}
          onClick={submit}
          data-test="confirm-action"
          id="confirm-action"
        >
          {submitButtonText || t('console-shared~Save')}
        </Button>,
        <Button
          key="cancel-action"
          type="button"
          variant="secondary"
          onClick={closeModal}
          data-test-id="modal-cancel-action"
        >
          {cancelButtonText || t('console-shared~Cancel')}
        </Button>,
      ]}
    >
      <form onSubmit={submit} name="form" className="modal-content">
        <FormGroup label={label} isRequired fieldId="input-value">
          <TextInput
            id="input-value"
            data-test="input-value"
            name="value"
            type={inputType}
            onChange={(_event, val) => {
              setValue(val);
              setErrorMessage('');
            }}
            value={value}
            isRequired
            autoFocus
            placeholder={placeholder}
          />
          {helpText && <div className="pf-v6-c-form__helper-text">{helpText}</div>}
        </FormGroup>
        {errorMessage && (
          <Alert
            isInline
            className="co-alert co-alert--scrollable"
            variant="danger"
            title={t('console-shared~An error occurred')}
            data-test="alert-error"
          >
            <div className="co-pre-line">{errorMessage}</div>
          </Alert>
        )}
      </form>
    </Modal>
  );
};
