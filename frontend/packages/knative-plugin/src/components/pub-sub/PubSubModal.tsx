import type { FC } from 'react';
import { Button, Form, ModalBody, ModalHeader, TextInputTypes } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import InputField from '@console/shared/src/components/formik-fields/InputField';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import PubSubFilter from './form-fields/PubSubFilter';
import PubSubSubscriber from './form-fields/PubSubSubscriber';

export interface PubSubModalProps {
  filterEnabled: boolean;
  labelTitle: string;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & PubSubModalProps;

const PubSubModal: FC<Props> = ({
  filterEnabled,
  labelTitle,
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  errors,
  values,
}) => {
  const { t } = useTranslation();
  const dirty = values?.formData?.metadata?.name && values?.formData?.spec?.subscriber?.ref?.name;
  return (
    <>
      <ModalHeader title={labelTitle} labelId="pub-sub-modal-title" data-test-id="modal-title" />
      <ModalBody>
        <Form id="pub-sub-form" onSubmit={handleSubmit} className="pf-v6-u-mr-md">
          <FormSection fullWidth>
            <InputField
              type={TextInputTypes.text}
              name="formData.metadata.name"
              label={t('knative-plugin~Name')}
              required
            />
            <PubSubSubscriber cancel={cancel} />
            {filterEnabled && <PubSubFilter />}
          </FormSection>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={status.error}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          isDisabled={!dirty || !_.isEmpty(errors) || isSubmitting}
          form="pub-sub-form"
        >
          {t('knative-plugin~Add')}
        </Button>
        <Button variant="link" onClick={cancel} type="button" data-test-id="modal-cancel-action">
          {t('knative-plugin~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export default PubSubModal;
