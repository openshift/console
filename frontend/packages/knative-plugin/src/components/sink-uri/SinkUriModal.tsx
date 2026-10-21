import type { FC } from 'react';
import {
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  ModalBody,
  ModalHeader,
  TextInputTypes,
} from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField, getFieldId } from '@console/shared';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

export interface SinkUriModalProps {
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & SinkUriModalProps;

const SinkUriModal: FC<Props> = ({
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
    <>
      <ModalHeader
        title={t('knative-plugin~Edit URI')}
        labelId="sink-uri-modal-title"
        data-test-id="modal-title"
      />
      <ModalBody>
        <Form id="sink-uri-form" onSubmit={handleSubmit} className="pf-v6-u-mr-md">
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
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={status.error}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          isDisabled={!dirty}
          form="sink-uri-form"
        >
          {t('knative-plugin~Save')}
        </Button>
        <Button variant="link" onClick={cancel} type="button" data-test-id="modal-cancel-action">
          {t('knative-plugin~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export default SinkUriModal;
