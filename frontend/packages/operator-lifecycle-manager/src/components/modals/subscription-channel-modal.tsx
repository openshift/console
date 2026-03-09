import type { FC, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Radio,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import { ResourceLink } from '@console/internal/components/utils';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { SubscriptionModel, ClusterServiceVersionModel } from '../../models';
import type { SubscriptionKind, PackageManifestKind } from '../../types';
import { DeprecatedOperatorWarningIcon } from '../deprecated-operator-warnings/deprecated-operator-warnings';

export const SubscriptionChannelModal: FC<SubscriptionChannelModalProps> = ({
  cancel,
  close,
  k8sUpdate,
  pkg,
  subscription,
}) => {
  const { t } = useTranslation();
  const currentChannel = subscription?.spec?.channel;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [selectedChannel, setSelectedChannel] = useState(currentChannel);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
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
    <>
      <ModalHeader title={t('olm~Change Subscription update channel')} data-test-id="modal-title" />
      <ModalBody>
        <Form id="subscription-channel-form" onSubmit={submit}>
          <FormGroup
            label={t('olm~Which channel is used to receive updates?')}
            fieldId="channel"
            role="radiogroup"
          >
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
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          form="subscription-channel-form"
          isLoading={inProgress}
          isDisabled={inProgress || selectedChannel === currentChannel}
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('public~Save')}
        </Button>
        <Button
          variant="link"
          onClick={cancel}
          isDisabled={inProgress}
          data-test-id="modal-cancel-action"
        >
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export type SubscriptionChannelModalProps = {
  k8sUpdate: (kind: K8sKind, newObj: K8sResourceKind) => Promise<any>;
  subscription: SubscriptionKind;
  pkg: PackageManifestKind;
} & ModalComponentProps;

export const SubscriptionChannelModalOverlay: OverlayComponent<SubscriptionChannelModalProps> = (
  props,
) => {
  return (
    <Modal variant={ModalVariant.small} isOpen onClose={props.closeOverlay}>
      <SubscriptionChannelModal {...props} close={props.closeOverlay} cancel={props.closeOverlay} />
    </Modal>
  );
};
