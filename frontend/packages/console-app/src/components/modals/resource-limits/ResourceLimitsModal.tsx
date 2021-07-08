import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import ResourceLimitSection from '@console/dev-console/src/components/import/advanced/ResourceLimitSection';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';

interface ResourceLimitsModalProps {
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & ResourceLimitsModalProps;

const ResourceLimitsModal: React.FC<Props> = ({
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  errors,
}) => {
  const { t } = useTranslation();
  return (
    <form className="modal-content modal-content--no-inner-scroll" onSubmit={handleSubmit}>
      <ModalTitle>{t('console-app~Edit resource limits')}</ModalTitle>
      <ModalBody>
        <ResourceLimitSection hideTitle />
      </ModalBody>
      <ModalSubmitFooter
        submitDisabled={!_.isEmpty(errors) || isSubmitting}
        inProgress={isSubmitting}
        errorMessage={status?.submitError}
        submitText={t('console-app~Save')}
        cancel={cancel}
      />
    </form>
  );
};

export default ResourceLimitsModal;
