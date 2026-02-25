import type { FC } from 'react';
import { Button, Form, ModalBody, ModalHeader } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import SinkUriResourcesGroup from '../add/event-sources/form-fields/SinkUriResourcesGroup';

export interface SinkSourceModalProps {
  resourceName: string;
  namespace: string;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & SinkSourceModalProps;

const SinkSourceModal: FC<Props> = ({
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
    <>
      <ModalHeader
        title={t('knative-plugin~Move sink')}
        labelId="sink-source-modal-title"
        data-test-id="modal-title"
      />
      <ModalBody>
        <Form id="sink-source-form" onSubmit={handleSubmit} className="pf-v6-u-mr-md">
          <p>
            <Trans
              t={t}
              ns="knative-plugin"
              i18nKey="Connects <strong>{{resourceName}}</strong> to"
            >
              Connects <strong>{{ resourceName }}</strong> to
            </Trans>
          </p>
          <FormSection fullWidth>
            <SinkUriResourcesGroup namespace={namespace} isMoveSink />
          </FormSection>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={status.error}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          isDisabled={!dirty || !_.isEmpty(errors)}
          form="sink-source-form"
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

export default SinkSourceModal;
