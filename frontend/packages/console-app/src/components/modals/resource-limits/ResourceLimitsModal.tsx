import type { FC } from 'react';
import { Button, Form, ModalBody, ModalHeader } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import ResourceLimitSection from '@console/dev-console/src/components/import/advanced/ResourceLimitSection';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

interface ResourceLimitsModalProps {
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & ResourceLimitsModalProps;

const ResourceLimitsModal: FC<Props> = ({ handleSubmit, cancel, isSubmitting, status, errors }) => {
  const { t } = useTranslation();
  return (
    <>
      <ModalHeader title={t('console-app~Edit resource limits')} />
      <ModalBody>
        <Form
          id="resource-limits-form"
          aria-label={t('console-app~Edit resource limits modal')}
          onSubmit={handleSubmit}
        >
          <ResourceLimitSection hideTitle />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={status?.submitError}>
        <Button
          variant="primary"
          type="submit"
          form="resource-limits-form"
          isLoading={isSubmitting}
          isDisabled={!_.isEmpty(errors) || isSubmitting}
        >
          {t('console-app~Save')}
        </Button>
        <Button variant="link" onClick={cancel}>
          {t('console-app~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export default ResourceLimitsModal;
