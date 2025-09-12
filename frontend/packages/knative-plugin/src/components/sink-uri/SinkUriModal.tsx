import * as React from 'react';
import {
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInputTypes,
} from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { InputField, getFieldId } from '@console/shared';

export interface SinkUriModalProps {
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & SinkUriModalProps;

const SinkUriModal: React.FC<Props> = ({
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  values,
  initialValues,
}) => {
  const { t } = useTranslation();
  const fieldId = getFieldId('sink-name', 'uri');
  const dirty = values?.uri !== initialValues.uri;
  return (
    <Form onSubmit={handleSubmit}>
      <div className="modal-content">
        <ModalTitle>{t('knative-plugin~Edit URI')}</ModalTitle>
        <ModalBody>
          <FormSection fullWidth>
            <FormGroup fieldId={fieldId} isRequired>
              <InputField
                type={TextInputTypes.text}
                name="uri"
                placeholder={t('knative-plugin~Enter URI')}
                data-test-id="edit-sink-uri"
                required
              />

              <FormHelperText>
                <HelperText>
                  <HelperTextItem>
                    {t('knative-plugin~Editing this URI will affect all associated Event Sources.')}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
          </FormSection>
        </ModalBody>
        <ModalSubmitFooter
          inProgress={isSubmitting}
          submitText={t('knative-plugin~Save')}
          submitDisabled={!dirty}
          cancelText={t('knative-plugin~Cancel')}
          cancel={cancel ?? (() => {})}
          errorMessage={status.error}
        />
      </div>
    </Form>
  );
};

export default SinkUriModal;
