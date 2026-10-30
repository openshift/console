import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { Button, Form, Modal, ModalBody, ModalHeader } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import type { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ClusterExtensionModel } from '@console/internal/models';
import { InlineEditButton } from '@console/shared/src/components/edit-button/InlineEditButton';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import type { ClusterExtensionKind } from '../../types';
import { ClusterExtensionChannelsField } from './ClusterExtensionChannelsField';

const ClusterExtensionChannelsUpdateModalContent: FC<
  ClusterExtensionChannelsUpdateModalContentProps
> = ({ obj, onClose }) => {
  const { t } = useTranslation('olm-v1');
  const [initialResource] = useState(obj);
  const source = initialResource.spec?.source?.catalog;
  const [channels, setChannels] = useState(() => [...new Set(source?.channels ?? [])]);
  const value = channels.length ? channels : undefined;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (value === undefined && source?.channels === undefined) {
      onClose();
      return;
    }

    const patch = source
      ? value === undefined
        ? { op: 'remove', path: '/spec/source/catalog/channels' }
        : { op: 'add', path: '/spec/source/catalog/channels', value }
      : { op: 'add', path: '/spec/source/catalog', value: { channels: value } };

    handlePromise(
      k8sPatchResource({
        model: ClusterExtensionModel,
        resource: obj,
        data: [
          ...(initialResource.metadata.resourceVersion
            ? [
                {
                  op: 'test',
                  path: '/metadata/resourceVersion',
                  value: initialResource.metadata.resourceVersion,
                },
              ]
            : []),
          patch,
        ],
      }),
    )
      .then(onClose)
      .catch(() => {});
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      variant="small"
      aria-labelledby="cluster-extension-channels-update-title"
    >
      <ModalHeader title={t('Edit channels')} labelId="cluster-extension-channels-update-title" />
      <ModalBody>
        <Form id="cluster-extension-channels-update-form" onSubmit={handleSubmit}>
          <ClusterExtensionChannelsField
            fieldId="cluster-extension-channels"
            values={channels}
            onChange={setChannels}
          />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          form="cluster-extension-channels-update-form"
          isLoading={inProgress}
          isDisabled={inProgress}
        >
          {t('Save')}
        </Button>
        <Button variant="link" onClick={onClose}>
          {t('Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </Modal>
  );
};

type ClusterExtensionChannelsUpdateModalContentProps = {
  obj: ClusterExtensionKind;
  onClose: () => void;
};

export const ClusterExtensionChannelsUpdateModal: FC<
  DetailsItemComponentProps<ClusterExtensionKind, string[]>
> = ({ obj, value: resourceValue }) => {
  const { t } = useTranslation('olm-v1');
  const [isOpen, setIsOpen] = useState(false);
  const [canPatch, accessReviewLoading] = useAccessReview({
    group: ClusterExtensionModel.apiGroup,
    resource: ClusterExtensionModel.plural,
    name: obj.metadata.name,
    verb: 'patch',
  });
  const value =
    (resourceValue ?? obj.spec?.source?.catalog?.channels)?.join(', ') || t('All channels');

  return (
    <>
      {canPatch || accessReviewLoading ? (
        <InlineEditButton
          testId={`${t('Channels')}-details-item__edit-button`}
          isDisabled={accessReviewLoading}
          onClick={() => setIsOpen(true)}
        >
          {value}
        </InlineEditButton>
      ) : (
        value
      )}
      {isOpen && (
        <ClusterExtensionChannelsUpdateModalContent obj={obj} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};
