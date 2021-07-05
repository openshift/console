import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory/modal';
import { LoadingInline } from '@console/internal/components/utils';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
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
            t('console-dynamic-plugin-sdk~Unknown error removing {{hpaLabel}} {{hpaName}}.', {
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
          {t('console-dynamic-plugin-sdk~Remove {{label}}?', {
            label: HorizontalPodAutoscalerModel.label,
          })}
        </ModalTitle>
        <ModalBody>
          {hpaName ? (
            <>
              <p>
                {t('console-dynamic-plugin-sdk~Are you sure you want to remove the {{hpaLabel}}', {
                  hpaLabel: HorizontalPodAutoscalerModel.label,
                })}{' '}
                <b>{hpaName}</b> {t('console-dynamic-plugin-sdk~from')} <b>{workloadName}</b>?
              </p>
              <p>
                {t(
                  'console-dynamic-plugin-sdk~The resources that are attached to the {{hpaLabel}} will be deleted.',
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
          submitText={t('console-dynamic-plugin-sdk~Remove')}
          submitDanger
          submitDisabled={!!submitError}
          cancel={close}
        />
      </div>
    </Form>
  );
};

export default createModalLauncher(DeleteHPAModal);
