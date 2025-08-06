import * as React from 'react';
import { Radio, Form, FormGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { SubscriptionModel, ClusterServiceVersionModel } from '../../models';
import { SubscriptionKind, PackageManifestKind } from '../../types';
import { DeprecatedOperatorWarningIcon } from '../deprecated-operator-warnings/deprecated-operator-warnings';

export const SubscriptionChannelModal: React.FC<SubscriptionChannelModalProps> = ({
  cancel,
  close,
  k8sUpdate,
  pkg,
  subscription,
}) => {
  const { t } = useTranslation();
  const currentChannel = subscription?.spec?.channel;
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
        <Form>
          <FormGroup label={t('olm~Which channel is used to receive updates?')} isStack>
            {pkg?.status?.channels?.map?.((channel) => {
              const checked = selectedChannel === channel.name;
              return (
                <Radio
                  key={channel.name}
                  id={`channel-${channel.name}`}
                  name="channel"
                  value={channel.name}
                  label={
                    <>
                      {channel.name}
                      <ResourceLink
                        linkTo={false}
                        name={channel.currentCSV}
                        title={channel.currentCSV}
                        kind={referenceForModel(ClusterServiceVersionModel)}
                      >
                        {channel?.deprecation ? (
                          <DeprecatedOperatorWarningIcon deprecation={channel?.deprecation} />
                        ) : null}
                      </ResourceLink>
                    </>
                  }
                  onChange={(e) => setSelectedChannel((e.target as HTMLInputElement).value)}
                  isChecked={checked}
                  data-checked-state={checked}
                />
              );
            })}
          </FormGroup>
        </Form>
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
