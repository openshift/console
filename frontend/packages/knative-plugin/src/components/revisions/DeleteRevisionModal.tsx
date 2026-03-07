import type { FC } from 'react';
import { Alert, Button, Form, ModalBody, ModalHeader } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { KNATIVE_SERVING_LABEL } from '../../const';
import { RevisionModel } from '../../models';
import type { RevisionItems } from '../../utils/traffic-splitting-utils';
import TrafficSplittingFields from '../traffic-splitting/TrafficSplittingFields';

interface TrafficSplittingDeleteModalProps {
  revisionItems: RevisionItems;
  deleteRevision: K8sResourceKind;
  showTraffic: boolean;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & TrafficSplittingDeleteModalProps;

const DeleteRevisionModal: FC<Props> = (props) => {
  const { t } = useTranslation();
  const { deleteRevision, handleSubmit, isSubmitting, status, showTraffic, cancel } = props;
  const serviceName = deleteRevision.metadata.labels[KNATIVE_SERVING_LABEL];

  return (
    <>
      <ModalHeader
        title={t('knative-plugin~Delete {{revlabel}}?', { revlabel: RevisionModel.label })}
        titleIconVariant="warning"
        labelId="delete-revision-modal-title"
        data-test-id="modal-title"
      />
      <ModalBody>
        <Form id="delete-revision-form" onSubmit={handleSubmit} className="pf-v6-u-mr-md">
          <p>
            {t('knative-plugin~Are you sure you want to delete ')}
            <strong className="co-break-word">{deleteRevision.metadata.name}</strong>{' '}
            {t('knative-plugin~from ')} <strong className="co-break-word">{serviceName}</strong>{' '}
            {t('knative-plugin~in namespace ')} <strong>{deleteRevision.metadata.namespace}</strong>
            ?
          </p>
          {showTraffic && (
            <>
              <Alert
                isInline
                className="co-alert"
                variant="custom"
                title={t(
                  'knative-plugin~Update the traffic distribution among the remaining Revisions',
                )}
              />
              <TrafficSplittingFields {...props} />
            </>
          )}
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={status.error}>
        <Button
          type="submit"
          variant="danger"
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
          form="delete-revision-form"
        >
          {t('knative-plugin~Delete')}
        </Button>
        <Button variant="link" onClick={cancel} type="button" data-test-id="modal-cancel-action">
          {t('knative-plugin~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export default DeleteRevisionModal;
