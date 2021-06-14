import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { SinkUriResourcesGroup } from '../add/event-sources/SinkSection';

export interface SinkSourceModalProps {
  resourceName: string;
  namespace: string;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & SinkSourceModalProps;

const SinkSourceModal: React.FC<Props> = ({
  resourceName,
  namespace,
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  errors,
  values,
  initialValues,
}) => {
  const { t } = useTranslation();
  const dirty =
    values?.formData?.sink?.name !== initialValues.formData.sink.name ||
    values?.formData?.sink?.uri !== initialValues.formData.sink.uri;
  return (
    <form className="modal-content modal-content--no-inner-scroll" onSubmit={handleSubmit}>
      <ModalTitle>{t('knative-plugin~Move sink')}</ModalTitle>
      <ModalBody>
        <p>
          {t('knative-plugin~Connects')} <strong>{resourceName}</strong> {t('knative-plugin~to')}
        </p>
        <FormSection fullWidth>
          <SinkUriResourcesGroup namespace={namespace} isMoveSink />
        </FormSection>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText={t('knative-plugin~Save')}
        submitDisabled={!dirty || !_.isEmpty(errors)}
        cancelText={t('knative-plugin~Cancel')}
        cancel={cancel}
        errorMessage={status.error}
      />
    </form>
  );
};

export default SinkSourceModal;
