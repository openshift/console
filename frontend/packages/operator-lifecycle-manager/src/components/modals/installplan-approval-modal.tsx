import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { RadioInput } from '@console/internal/components/radio';
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

export const InstallPlanApprovalModal: React.FC<InstallPlanApprovalModalProps> = ({
  cancel,
  close,
  k8sUpdate,
  obj,
}) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [selectedApprovalStrategy, setSelectedApprovalStrategy] = React.useState(
    getApprovalStrategy(obj),
  );
  const submit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
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
        <div className="co-m-form-row">
          <p>{t('olm~What strategy is used for approving updates?')}</p>
        </div>
        <div className="co-m-form-row row">
          <div className="col-sm-12">
            <RadioInput
              onChange={(e) => setSelectedApprovalStrategy(e.target.value)}
              value={InstallPlanApproval.Automatic}
              checked={selectedApprovalStrategy === InstallPlanApproval.Automatic}
              title={t(`olm~Automatic`)}
              subTitle={`(${t('public~default')})`}
            >
              <div className="co-m-radio-desc">
                <p className="text-muted">
                  {t('olm~New updates will be installed as soon as they become available.')}
                </p>
              </div>
            </RadioInput>
          </div>
          <div className="col-sm-12">
            <RadioInput
              onChange={(e) => setSelectedApprovalStrategy(e.target.value)}
              value={InstallPlanApproval.Manual}
              checked={selectedApprovalStrategy === InstallPlanApproval.Manual}
              title={t(`olm~Manual`)}
            >
              <div className="co-m-radio-desc">
                <p className="text-muted">
                  {t('olm~New updates need to be manually approved before installation begins.')}
                </p>
              </div>
            </RadioInput>
          </div>
        </div>
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
