import type { FC, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { Grid, GridItem, Radio } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import {
  K8sKind,
  K8sResourceKind,
  modelFor,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { SubscriptionModel, InstallPlanModel } from '../../models';
import { SubscriptionKind, InstallPlanApproval, InstallPlanKind } from '../../types';

const getApprovalStrategy = (obj: InstallPlanKind | SubscriptionKind): InstallPlanApproval =>
  (obj as SubscriptionKind)?.spec?.installPlanApproval ??
  (obj as InstallPlanKind)?.spec?.approval ??
  InstallPlanApproval.Automatic;

export const InstallPlanApprovalModal: FC<InstallPlanApprovalModalProps> = ({
  cancel,
  close,
  k8sUpdate,
  obj,
}) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [selectedApprovalStrategy, setSelectedApprovalStrategy] = useState(
    getApprovalStrategy(obj),
  );
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const updatedObj = _.cloneDeep(obj);
      if (referenceFor(updatedObj) === referenceForModel(SubscriptionModel)) {
        (updatedObj as SubscriptionKind).spec.installPlanApproval = selectedApprovalStrategy;
      } else if (referenceFor(updatedObj) === referenceForModel(InstallPlanModel)) {
        (updatedObj as InstallPlanKind).spec.approval = selectedApprovalStrategy;
      }
      handlePromise(k8sUpdate(modelFor(referenceFor(obj)), updatedObj))
        .then(() => close?.())
        .catch(_.noop);
    },
    [close, handlePromise, k8sUpdate, obj, selectedApprovalStrategy],
  );

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle className="modal-header">{t('olm~Change update approval strategy')}</ModalTitle>
      <ModalBody>
        <Grid hasGutter>
          <GridItem>
            <p>{t('olm~What strategy is used for approving updates?')}</p>
          </GridItem>

          <GridItem>
            <Radio
              id="approval-strategy-automatic"
              name="approval-strategy"
              value={InstallPlanApproval.Automatic}
              label={`${t(`olm~Automatic`)} (${t('public~default')})`}
              description={t('olm~New updates will be installed as soon as they become available.')}
              onChange={(e) =>
                setSelectedApprovalStrategy(
                  (e.target as HTMLInputElement).value as InstallPlanApproval,
                )
              }
              isChecked={selectedApprovalStrategy === InstallPlanApproval.Automatic}
              data-checked-state={selectedApprovalStrategy === InstallPlanApproval.Automatic}
            />
          </GridItem>
          <GridItem>
            <Radio
              id="approval-strategy-manual"
              name="approval-strategy"
              value={InstallPlanApproval.Manual}
              label={t('olm~Manual')}
              description={t(
                'olm~New updates need to be manually approved before installation begins.',
              )}
              onChange={(e) =>
                setSelectedApprovalStrategy(
                  (e.target as HTMLInputElement).value as InstallPlanApproval,
                )
              }
              isChecked={selectedApprovalStrategy === InstallPlanApproval.Manual}
              data-checked-state={selectedApprovalStrategy === InstallPlanApproval.Manual}
            />
          </GridItem>
        </Grid>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        cancel={cancel}
        submitText={t('public~Save')}
        submitDisabled={getApprovalStrategy(obj) === selectedApprovalStrategy}
      />
    </form>
  );
};

export const createInstallPlanApprovalModal = createModalLauncher<InstallPlanApprovalModalProps>(
  InstallPlanApprovalModal,
);

export type InstallPlanApprovalModalProps = {
  cancel?: () => void;
  close?: () => void;
  k8sUpdate: (kind: K8sKind, newObj: K8sResourceKind) => Promise<any>;
  obj: InstallPlanKind | SubscriptionKind;
};
