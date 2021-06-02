import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { RadioInput } from '@console/internal/components/radio';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { SubscriptionModel, ClusterServiceVersionModel } from '../../models';
import { SubscriptionKind, PackageManifestKind } from '../../types';

export const SubscriptionChannelModal: React.FC<SubscriptionChannelModalProps> = ({
  cancel,
  close,
  k8sUpdate,
  pkg,
  subscription,
}) => {
  const { t } = useTranslation();
  const currentChannel = subscription?.spec?.channel ?? pkg?.status?.channels?.[0]?.name;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [selectedChannel, setSelectedChannel] = React.useState(currentChannel);

  const submit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      handlePromise(
        k8sUpdate(SubscriptionModel, {
          ...subscription,
          spec: {
            ...subscription.spec,
            channel: selectedChannel,
          },
        }),
      )
        .then(() => close?.())
        .catch(() => {});
    },
    [close, handlePromise, k8sUpdate, selectedChannel, subscription],
  );

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle className="modal-header">
        {t('olm~Change Subscription update channel')}
      </ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>{t('olm~Which channel is used to receive updates?')}</p>
        </div>
        <div className="co-m-form-row row">
          {pkg?.status?.channels?.map?.((channel) => (
            <div key={channel.name} className="col-sm-12">
              <RadioInput
                onChange={(e) => setSelectedChannel(e.target.value)}
                value={channel.name}
                checked={selectedChannel === channel.name}
                title={channel.name}
                subTitle={
                  <ResourceLink
                    linkTo={false}
                    name={channel.currentCSV}
                    title={channel.currentCSV}
                    kind={referenceForModel(ClusterServiceVersionModel)}
                  />
                }
              />
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        cancel={cancel}
        submitText={t('public~Save')}
        submitDisabled={selectedChannel === currentChannel}
      />
    </form>
  );
};

export const createSubscriptionChannelModal = createModalLauncher<SubscriptionChannelModalProps>(
  SubscriptionChannelModal,
);

export type SubscriptionChannelModalProps = {
  cancel?: () => void;
  close?: () => void;
  k8sUpdate: (kind: K8sKind, newObj: K8sResourceKind) => Promise<any>;
  subscription: SubscriptionKind;
  pkg: PackageManifestKind;
};
