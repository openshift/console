import type { FC } from 'react';
import { useState } from 'react';
import { Form } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_global_icon_color_status_warning_default as warningColor } from '@patternfly/react-tokens';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import {
  ModalBody,
  ModalSubmitFooter,
  ModalTitle,
  ModalWrapper,
} from '@console/internal/components/factory/modal';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import type { HorizontalPodAutoscalerKind, K8sResourceCommon } from '@console/internal/module/k8s';
import { k8sKill } from '@console/internal/module/k8s';

type DeleteHPAModalProps = ModalComponentProps & {
  hpa: HorizontalPodAutoscalerKind;
  workload: K8sResourceCommon;
};

const DeleteHPAModal: FC<DeleteHPAModalProps> = ({ close, cancel, hpa, workload }) => {
  const [submitError, setSubmitError] = useState<string>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { t } = useTranslation();
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
            t('console-shared~Unknown error removing {{hpaLabel}} {{hpaName}}.', {
              hpaLabel: HorizontalPodAutoscalerModel.label,
              hpaName,
            }),
        );
      });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="modal-content">
        <ModalTitle>
          <ExclamationTriangleIcon color={warningColor.value} />{' '}
          {t('console-shared~Remove {{label}}?', { label: HorizontalPodAutoscalerModel.label })}
        </ModalTitle>
        <ModalBody>
          {hpaName ? (
            <>
              <p>
                {t('console-shared~Are you sure you want to remove the {{hpaLabel}}', {
                  hpaLabel: HorizontalPodAutoscalerModel.label,
                })}{' '}
                <b>{hpaName}</b> {t('console-shared~from')} <b>{workloadName}</b>?
              </p>
              <p>
                {t(
                  'console-shared~The resources that are attached to the {{hpaLabel}} will be deleted.',
                  { hpaLabel: HorizontalPodAutoscalerModel.label },
                )}
              </p>
            </>
          ) : (
            !submitError && <LoadingInline />
          )}
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={submitError}
          inProgress={isSubmitting}
          submitText={t('console-shared~Remove')}
          submitDanger
          submitDisabled={!!submitError}
          cancel={cancel}
        />
      </div>
    </Form>
  );
};

type DeleteHPAModalProviderProps = {
  hpa: HorizontalPodAutoscalerKind;
  workload: K8sResourceCommon;
};

const DeleteHPAModalProvider: OverlayComponent<DeleteHPAModalProviderProps> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <DeleteHPAModal
        close={props.closeOverlay}
        cancel={props.closeOverlay}
        hpa={props.hpa}
        workload={props.workload}
      />
    </ModalWrapper>
  );
};

export default DeleteHPAModalProvider;
