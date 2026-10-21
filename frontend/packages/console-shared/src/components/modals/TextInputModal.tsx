import { useState, useCallback } from 'react';
import {
  Button,
  TextInput,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
} from '@patternfly/react-core';
import type { TextInputProps } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalFooterWithAlerts } from './ModalFooterWithAlerts';

export interface TextInputModalProps {
  title: string;
  label: string;
  initialValue: string;
  onSubmit: (value: string) => void;
  validator?: (value: string) => string | null; // Returns error message or null if valid
  submitButtonText?: string;
  cancelButtonText?: string;
  inputType?: TextInputProps['type'];
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
}

export const TextInputModal: OverlayComponent<TextInputModalProps> = ({
  closeOverlay,
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
  isRequired = false,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const [errorMessage, setErrorMessage] = useState('');

  const submit = useCallback(
    (event: React.FormEvent | React.MouseEvent) => {
      event.preventDefault();
      if (isRequired && !value) {
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
      closeOverlay();
    },
    [validator, onSubmit, closeOverlay, value, isRequired, t],
  );

  return (
    <Modal variant="small" isOpen onClose={closeOverlay}>
      <ModalHeader title={title} />
      <ModalBody>
        <Form onSubmit={submit}>
          <FormGroup label={label} isRequired={isRequired} fieldId="input-value">
            <TextInput
              id="input-value"
              data-test="input-value"
              name="value"
              type={inputType}
              onChange={(_event, val) => {
                setValue(val);
              }}
              value={value}
              isRequired={isRequired}
              autoFocus
              placeholder={placeholder}
            />
            {helpText && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>{helpText}</HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          key="confirm-action"
          type="submit"
          variant="primary"
          disabled={isRequired && !value}
          onClick={submit}
          data-test="confirm-action"
          id="confirm-action"
        >
          {submitButtonText || t('console-shared~Save')}
        </Button>
        <Button
          key="cancel-action"
          type="button"
          variant="link"
          onClick={closeOverlay}
          data-test-id="modal-cancel-action"
        >
          {cancelButtonText || t('console-shared~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </Modal>
  );
};
