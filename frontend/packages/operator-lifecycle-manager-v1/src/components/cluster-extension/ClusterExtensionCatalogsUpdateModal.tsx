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
import type { CatalogSource } from './cluster-extension-catalog-selector';
import { catalogNames, selectorForCatalogs } from './cluster-extension-catalog-selector';
import { ClusterExtensionCatalogsField } from './ClusterExtensionCatalogsField';

const ClusterExtensionCatalogsUpdateModalContent: FC<
  ClusterExtensionCatalogsUpdateModalContentProps
> = ({ obj, onClose }) => {
  const { t } = useTranslation('olm-v1');
  const [initialResource] = useState(obj);
  const source = initialResource.spec?.source?.catalog;
  const [catalogs, setCatalogs] = useState(() => [...new Set(catalogNames(source?.selector))]);
  const value = selectorForCatalogs(catalogs, source?.selector);
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (value === undefined && source?.selector === undefined) {
      onClose();
      return;
    }

    const patch = source
      ? value === undefined
        ? { op: 'remove', path: '/spec/source/catalog/selector' }
        : { op: 'add', path: '/spec/source/catalog/selector', value }
      : { op: 'add', path: '/spec/source/catalog', value: { selector: value } };

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
      aria-labelledby="cluster-extension-catalogs-update-title"
    >
      <ModalHeader title={t('Edit catalogs')} labelId="cluster-extension-catalogs-update-title" />
      <ModalBody>
        <Form id="cluster-extension-catalogs-update-form" onSubmit={handleSubmit}>
          <ClusterExtensionCatalogsField
            fieldId="cluster-extension-catalogs"
            values={catalogs}
            onChange={setCatalogs}
          />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          form="cluster-extension-catalogs-update-form"
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

type ClusterExtensionCatalogsUpdateModalContentProps = {
  obj: ClusterExtensionKind;
  onClose: () => void;
};

export const ClusterExtensionCatalogsUpdateModal: FC<
  DetailsItemComponentProps<ClusterExtensionKind, CatalogSource['selector']>
> = ({ obj, value: resourceValue }) => {
  const { t } = useTranslation('olm-v1');
  const [isOpen, setIsOpen] = useState(false);
  const [canPatch, accessReviewLoading] = useAccessReview({
    group: ClusterExtensionModel.apiGroup,
    resource: ClusterExtensionModel.plural,
    name: obj.metadata.name,
    verb: 'patch',
  });
  const selector: CatalogSource['selector'] = resourceValue ?? obj.spec?.source?.catalog?.selector;
  const value =
    catalogNames(selector).join(', ') ||
    (Object.keys(selector?.matchLabels ?? {}).length || selector?.matchExpressions?.length
      ? t('Custom catalog selector. To view or edit it, use the YAML tab.')
      : t('All catalogs'));

  return (
    <>
      {canPatch || accessReviewLoading ? (
        <InlineEditButton
          testId={`${t('Catalogs')}-details-item__edit-button`}
          isDisabled={accessReviewLoading}
          onClick={() => setIsOpen(true)}
        >
          {value}
        </InlineEditButton>
      ) : (
        value
      )}
      {isOpen && (
        <ClusterExtensionCatalogsUpdateModalContent obj={obj} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};
