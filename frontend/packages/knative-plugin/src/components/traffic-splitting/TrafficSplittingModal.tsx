import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import TrafficSplittingFields from './TrafficSplittingFields';
import { RevisionItems } from '../../utils/traffic-splitting-utils';

interface TrafficSplittingModalProps {
  revisionItems: RevisionItems;
}

type Props = FormikProps<FormikValues> & TrafficSplittingModalProps & ModalComponentProps;

const TrafficSplittingModal: React.FC<Props> = (props) => {
  const { handleSubmit, cancel, isSubmitting, status } = props;
  return (
    <form className="modal-content" onSubmit={handleSubmit}>
      <ModalTitle>Set Traffic Distribution</ModalTitle>
      <ModalBody>
        <p>Set traffic distribution for the Revisions of the Knative Service</p>
        <TrafficSplittingFields {...props} />
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText="Save"
        cancel={cancel}
        errorMessage={status.error}
      />
    </form>
  );
};

export default TrafficSplittingModal;
