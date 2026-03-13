import type { FC } from 'react';
import { Button, Form, ModalBody, ModalHeader } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import type { RevisionItems } from '../../utils/traffic-splitting-utils';
import TrafficSplittingFields from './TrafficSplittingFields';

interface TrafficSplittingModalProps {
  revisionItems: RevisionItems;
}

type Props = FormikProps<FormikValues> & TrafficSplittingModalProps & ModalComponentProps;

const TrafficSplittingModal: FC<Props> = (props) => {
  const { t } = useTranslation();
  const { handleSubmit, cancel, isSubmitting, status } = props;
  return (
    <>
      <ModalHeader
        title={t('knative-plugin~Set traffic distribution')}
        labelId="traffic-splitting-modal-title"
        data-test-id="modal-title"
      />
      <ModalBody>
        <Form id="traffic-splitting-form" onSubmit={handleSubmit} className="pf-v6-u-mr-md">
          <p>
            {t('knative-plugin~Set traffic distribution for the Revisions of the Knative Service')}
          </p>
          <TrafficSplittingFields {...props} />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={status.error}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
          form="traffic-splitting-form"
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

export default TrafficSplittingModal;
