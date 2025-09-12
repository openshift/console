import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import SinkUriResourcesGroup from '../add/event-sources/form-fields/SinkUriResourcesGroup';

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
    values?.formData?.sink?.key !== initialValues.formData.sink.key ||
    values?.formData?.sink?.uri !== initialValues.formData.sink.uri;

  return (
    <form className="modal-content" onSubmit={handleSubmit}>
      <ModalTitle>{t('knative-plugin~Move sink')}</ModalTitle>
      <ModalBody>
        <p>
          <Trans t={t} ns="knative-plugin" i18nKey="Connects <strong>{{resourceName}}</strong> to">
            Connects <strong>{{ resourceName }}</strong> to
          </Trans>
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
        cancel={cancel ?? (() => {})}
        errorMessage={status.error}
      />
    </form>
  );
};

export default SinkSourceModal;
