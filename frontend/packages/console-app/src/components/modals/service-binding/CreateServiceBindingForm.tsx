import * as React from 'react';
import { TextInputTypes, Title } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { InputField } from '@console/shared';
import BindableServices from './BindableServices';

export type CreateServiceBindingFormProps = {
  resource: K8sResourceKind;
  cancel?: () => void;
};

const CreateServiceBindingForm: React.FC<FormikProps<FormikValues> &
  CreateServiceBindingFormProps> = ({
  resource,
  handleSubmit,
  isSubmitting,
  cancel,
  status,
  dirty,
  errors,
}) => {
  const { t } = useTranslation();
  return (
    <form onSubmit={handleSubmit} className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('console-app~Create Service Binding')}</ModalTitle>
      <ModalBody>
        <Title headingLevel="h2" size="md" className="co-m-form-row">
          {t('console-app~Select a service to connect to.')}
        </Title>
        <FormSection fullWidth>
          <InputField
            type={TextInputTypes.text}
            name="name"
            label={t('console-app~Name')}
            required
          />
          <BindableServices resource={resource} />
        </FormSection>
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('console-app~Create')}
        submitDisabled={!dirty || isSubmitting || !_.isEmpty(errors)}
        cancel={cancel}
        inProgress={isSubmitting}
        errorMessage={status?.submitError}
      />
    </form>
  );
};

export default CreateServiceBindingForm;
