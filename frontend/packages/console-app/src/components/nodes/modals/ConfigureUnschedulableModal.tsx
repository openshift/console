import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  createModalLauncher,
} from '@console/internal/components/factory/modal';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { makeNodeUnschedulable } from '../../../k8s/requests/nodes';

type ConfigureUnschedulableModalProps = HandlePromiseProps & {
  resource: NodeKind;
  cancel?: () => void;
  close?: () => void;
};

const ConfigureUnschedulableModal: React.FC<ConfigureUnschedulableModalProps> = ({
  handlePromise,
  resource,
  close,
  cancel,
  errorMessage,
  inProgress,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    handlePromise(makeNodeUnschedulable(resource), close);
  };
  const { t } = useTranslation();
  return (
    <form onSubmit={handleSubmit} name="form" className="modal-content ">
      <ModalTitle>{t('console-app~Mark as unschedulable')}</ModalTitle>
      <ModalBody>
        {t(
          "console-app~Unschedulable nodes won't accept new pods. This is useful for scheduling maintenance or preparing to decommission a node.",
        )}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('console-app~Mark unschedulable')}
        cancel={cancel}
      />
    </form>
  );
};

export default createModalLauncher(withHandlePromise(ConfigureUnschedulableModal));
