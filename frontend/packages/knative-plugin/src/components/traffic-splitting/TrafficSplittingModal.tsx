import type { FC } from 'react';
import { Button, Form, ModalBody, ModalHeader } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import type { RevisionItems } from '../../utils/traffic-splitting-utils';
import TrafficSplittingFields from './TrafficSplittingFields';

interface TrafficSplittingModalProps {
  revisionItems: RevisionItems;
}

type Props = FormikProps<FormikValues> & TrafficSplittingModalProps & ModalComponentProps;

const TrafficSplittingModal: FC<Props> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { handleSubmit, cancel, isSubmitting, status } = props;
  return (
    <>
      <ModalHeader
        title={t('Set traffic distribution')}
        labelId="traffic-splitting-modal-title"
        data-test-id="modal-title"
      />
      <ModalBody>
        <Form id="traffic-splitting-form" onSubmit={handleSubmit} className="pf-v6-u-mr-md">
          <p>{t('Set traffic distribution for the Revisions of the Knative Service')}</p>
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
          {t('Save')}
        </Button>
        <Button variant="link" onClick={cancel} type="button" data-test-id="modal-cancel-action">
          {t('Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export default TrafficSplittingModal;
