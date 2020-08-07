import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory/modal';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import { LoadingInline } from '@console/internal/components/utils';
import {
  HorizontalPodAutoscalerKind,
  k8sKill,
  K8sResourceCommon,
} from '@console/internal/module/k8s';

type DeleteHPAModalProps = ModalComponentProps & {
  hpa: HorizontalPodAutoscalerKind;
  workload: K8sResourceCommon;
};

const DeleteHPAModal: React.FC<DeleteHPAModalProps> = ({ close, hpa, workload }) => {
  const [submitError, setSubmitError] = React.useState<string>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const hpaName = hpa.metadata.name;
  const workloadName = workload.metadata.name;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    k8sKill(HorizontalPodAutoscalerModel, hpa)
      .then(() => {
        close();
      })
      .catch((error) => {
        setSubmitError(
          error?.message ||
            `Unknown error removing ${HorizontalPodAutoscalerModel.label} ${hpaName}.`,
        );
      });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="modal-content">
        <ModalTitle>
          <ExclamationTriangleIcon color={warningColor.value} /> Remove{' '}
          {HorizontalPodAutoscalerModel.label}?
        </ModalTitle>
        <ModalBody>
          {hpaName ? (
            <>
              <p>
                Are you sure you want to remove the {HorizontalPodAutoscalerModel.label}{' '}
                <b>{hpaName}</b> from <b>{workloadName}</b>?
              </p>
              <p>
                The resources that are attached to the {HorizontalPodAutoscalerModel.label} will be
                deleted.
              </p>
            </>
          ) : (
            !submitError && <LoadingInline />
          )}
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={submitError}
          inProgress={isSubmitting}
          submitText="Remove"
          submitDanger
          submitDisabled={!!submitError}
          cancel={close}
        />
      </div>
    </Form>
  );
};

export default createModalLauncher(DeleteHPAModal);
