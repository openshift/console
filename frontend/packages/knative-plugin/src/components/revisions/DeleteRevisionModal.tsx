import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';
import { YellowExclamationTriangleIcon } from '@console/shared';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { RevisionModel } from '../../models';
import TrafficSplittingFields from '../traffic-splitting/TrafficSplittingFields';
import { RevisionItems } from '../../utils/traffic-splitting-utils';
import { KNATIVE_SERVING_LABEL } from '../../const';

interface TrafficSplittingDeleteModalProps {
  revisionItems: RevisionItems;
  deleteRevision: K8sResourceKind;
  showTraffic: boolean;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & TrafficSplittingDeleteModalProps;

const DeleteRevisionModal: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { deleteRevision, handleSubmit, isSubmitting, status, showTraffic, cancel } = props;
  const serviceName = deleteRevision.metadata.labels[KNATIVE_SERVING_LABEL];

  return (
    <form className="modal-content" onSubmit={handleSubmit}>
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('knative-plugin~Delete {{revlabel}}?', { revlabel: RevisionModel.label })}
      </ModalTitle>
      <ModalBody>
        <p>
          {t('knative-plugin~Are you sure you want to delete ')}
          <strong className="co-break-word">{deleteRevision.metadata.name}</strong>{' '}
          {t('knative-plugin~from ')} <strong className="co-break-word">{serviceName}</strong>{' '}
          {t('knative-plugin~in namespace ')} <strong>{deleteRevision.metadata.namespace}</strong>?
        </p>
        {showTraffic && (
          <>
            <Alert
              isInline
              className="co-alert"
              variant="default"
              title={t(
                'knative-plugin~Update the traffic distribution among the remaining Revisions',
              )}
            />
            <TrafficSplittingFields {...props} />
          </>
        )}
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText={t('knative-plugin~Delete')}
        cancelText={t('knative-plugin~Cancel')}
        cancel={cancel}
        errorMessage={status.error}
        submitDisabled={isSubmitting}
        submitDanger
      />
    </form>
  );
};

export default DeleteRevisionModal;
