import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { RevisionItems } from '../../utils/traffic-splitting-utils';
import TrafficSplittingFields from './TrafficSplittingFields';

interface TrafficSplittingModalProps {
  revisionItems: RevisionItems;
}

type Props = FormikProps<FormikValues> & TrafficSplittingModalProps & ModalComponentProps;

const TrafficSplittingModal: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { handleSubmit, cancel, isSubmitting, status } = props;
  return (
    <form className="modal-content" onSubmit={handleSubmit}>
      <ModalTitle>{t('knative-plugin~Set traffic distribution')}</ModalTitle>
      <ModalBody>
        <p>
          {t('knative-plugin~Set traffic distribution for the Revisions of the Knative Service')}
        </p>
        <TrafficSplittingFields {...props} />
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitDisabled={isSubmitting}
        submitText={t('knative-plugin~Save')}
        cancelText={t('knative-plugin~Cancel')}
        cancel={cancel}
        errorMessage={status.error}
      />
    </form>
  );
};

export default TrafficSplittingModal;
