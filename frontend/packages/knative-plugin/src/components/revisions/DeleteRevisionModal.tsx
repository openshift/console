import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
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
  const { deleteRevision, handleSubmit, isSubmitting, status, showTraffic, cancel } = props;
  const serviceName = deleteRevision.metadata.labels[KNATIVE_SERVING_LABEL];

  return (
    <form className="modal-content" onSubmit={handleSubmit}>
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> Delete {RevisionModel.label}?
      </ModalTitle>
      <ModalBody>
        <p>
          Are you sure you want to delete{' '}
          <strong className="co-break-word">{deleteRevision.metadata.name}</strong> from{' '}
          <strong className="co-break-word">{serviceName}</strong> in namespace{' '}
          <strong>{deleteRevision.metadata.namespace}</strong>?
        </p>
        {showTraffic && (
          <>
            <Alert
              isInline
              className="co-alert"
              variant="default"
              title="Update the traffic distribution among the remaining Revisions"
            />
            <TrafficSplittingFields {...props} />
          </>
        )}
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText="Delete"
        cancel={cancel}
        errorMessage={status.error}
        submitDanger
      />
    </form>
  );
};

export default DeleteRevisionModal;
