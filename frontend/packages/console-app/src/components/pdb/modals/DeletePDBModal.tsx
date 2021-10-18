import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { useTranslation, Trans } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory/modal';
import { LoadingInline } from '@console/internal/components/utils';
import { k8sKill } from '@console/internal/module/k8s';
import { PodDisruptionBudgetModel } from '../../../models';
import { PodDisruptionBudgetKind } from '../types';

const DeletePDBModal: React.FC<DeletePDBModalProps> = ({ close, pdb, workloadName }) => {
  const [submitError, setSubmitError] = React.useState<string>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const { t } = useTranslation();
  const pdbName = pdb.metadata.name;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    k8sKill(PodDisruptionBudgetModel, pdb)
      .then(() => {
        close();
      })
      .catch((error) => {
        setSubmitError(
          error?.message ||
            t('console-app~Unknown error removing PodDisruptionBudget {{pdbName}}.', {
              pdbName,
            }),
        );
      });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <ModalTitle>
        <ExclamationTriangleIcon color={warningColor.value} />{' '}
        {t('console-app~Remove PodDisruptionBudget?')}
      </ModalTitle>
      <ModalBody>
        {pdbName ? (
          <>
            <p>
              <Trans t={t} ns="console-app">
                Are you sure you want to remove the PodDisruptionBudget <b>{{ pdbName }}</b> from{' '}
                <b>{{ workloadName }}</b>?
              </Trans>
            </p>
            <p>{t('console-app~The PodDisruptionBudget will be deleted.')}</p>
          </>
        ) : (
          !submitError && <LoadingInline />
        )}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={submitError}
        inProgress={isSubmitting}
        submitText={t('console-app~Remove')}
        submitDanger
        submitDisabled={!!submitError}
        cancel={close}
      />
    </Form>
  );
};

export const deletePDBModal = createModalLauncher(DeletePDBModal);

export type DeletePDBModalProps = ModalComponentProps & {
  pdb: PodDisruptionBudgetKind;
  workloadName: string;
};
