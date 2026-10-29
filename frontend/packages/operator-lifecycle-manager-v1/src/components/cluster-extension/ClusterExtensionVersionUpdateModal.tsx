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
import { ClusterExtensionVersionField } from './ClusterExtensionVersionField';

const ClusterExtensionVersionUpdateModalContent: FC<
  ClusterExtensionVersionUpdateModalContentProps
> = ({ obj, onClose }) => {
  const { t } = useTranslation('olm-v1');
  const [initialResource] = useState(obj);
  const source = initialResource.spec?.source?.catalog;
  const [version, setVersion] = useState(() => source?.version ?? '');
  const value = version || undefined;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (value === undefined && source?.version === undefined) {
      onClose();
      return;
    }

    const patch = source
      ? value === undefined
        ? { op: 'remove', path: '/spec/source/catalog/version' }
        : { op: 'add', path: '/spec/source/catalog/version', value }
      : { op: 'add', path: '/spec/source/catalog', value: { version: value } };

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
      aria-labelledby="cluster-extension-version-update-title"
    >
      <ModalHeader title={t('Edit version')} labelId="cluster-extension-version-update-title" />
      <ModalBody>
        <Form id="cluster-extension-version-update-form" onSubmit={handleSubmit}>
          <ClusterExtensionVersionField
            fieldId="cluster-extension-version"
            value={version}
            onChange={setVersion}
          />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          form="cluster-extension-version-update-form"
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

type ClusterExtensionVersionUpdateModalContentProps = {
  obj: ClusterExtensionKind;
  onClose: () => void;
};

export const ClusterExtensionVersionUpdateModal: FC<
  DetailsItemComponentProps<ClusterExtensionKind, string>
> = ({ obj, value: resourceValue }) => {
  const { t } = useTranslation('olm-v1');
  const [isOpen, setIsOpen] = useState(false);
  const [canPatch, accessReviewLoading] = useAccessReview({
    group: ClusterExtensionModel.apiGroup,
    resource: ClusterExtensionModel.plural,
    name: obj.metadata.name,
    verb: 'patch',
  });
  const value = resourceValue || obj.spec?.source?.catalog?.version || t('Any version');

  return (
    <>
      {canPatch || accessReviewLoading ? (
        <InlineEditButton
          testId={`${t('Version')}-details-item__edit-button`}
          isDisabled={accessReviewLoading}
          onClick={() => setIsOpen(true)}
        >
          {value}
        </InlineEditButton>
      ) : (
        value
      )}
      {isOpen && (
        <ClusterExtensionVersionUpdateModalContent obj={obj} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};
