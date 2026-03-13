import type { FC, MouseEvent } from 'react';
import { Button, Flex, FlexItem, Truncate } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { useTranslation } from 'react-i18next';
import type { K8sModel } from '@console/internal/module/k8s';
import { modelFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { NavItemResource } from './NavItemResource';
import useConfirmNavUnpinModal from './useConfirmNavUnpinModal';

interface PinnedResourceProps {
  resourceRef: string;
  navResources: string[];
  onChange: (pinnedResources: string[]) => void;
  idx: number;
}

interface RemoveButtonProps {
  resourceRef: string;
  navResources: string[];
  onChange: (pinnedResources: string[]) => void;
}

export type DragItem = {
  idx: number;
  id: string;
  type: string;
};

const RemoveButton: FC<RemoveButtonProps> = ({ resourceRef, navResources, onChange }) => {
  const { t } = useTranslation();
  const confirmNavUnpinModal = useConfirmNavUnpinModal(navResources, onChange);
  const unPin = (e: MouseEvent<HTMLButtonElement>, navItem: string) => {
    e.preventDefault();
    e.stopPropagation();
    confirmNavUnpinModal(navItem);
  };
  return (
    <Button
      icon={<MinusCircleIcon />}
      variant="link"
      aria-label={t('console-app~Unpin')}
      onClick={(e) => unPin(e, resourceRef)}
    />
  );
};

const PinnedResource: FC<PinnedResourceProps> = ({ resourceRef, onChange, navResources }) => {
  const { t } = useTranslation();

  const [model] = useK8sModel(resourceRef);
  if (!model) {
    return null;
  }
  const { apiVersion, apiGroup, namespaced, kind } = model;

  const getLabelForResourceRef = (resourceName: string): string => {
    const resourceModel: K8sModel | undefined = modelFor(resourceName);
    if (resourceModel) {
      if (resourceModel.labelPluralKey) {
        return t(resourceModel.labelPluralKey);
      }
      return resourceModel.labelPlural || resourceModel.plural;
    }
    return '';
  };
  const label = getLabelForResourceRef(resourceRef);
  const duplicates = navResources.filter((res) => getLabelForResourceRef(res) === label).length > 1;
  return (
    <NavItemResource
      key={`pinned-${resourceRef}`}
      namespaced={namespaced}
      title={duplicates ? `${label}: ${apiGroup || 'core'}/${apiVersion}` : null}
      model={{ group: apiGroup, version: apiVersion, kind }}
      id={resourceRef}
      className="pf-v6-u-flex-grow-1"
      dataAttributes={{
        className: 'pf-v6-u-py-0 pf-v6-u-pr-0',
        'data-test': 'draggable-pinned-resource-item',
      }}
    >
      <Flex
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        alignItems={{ default: 'alignItemsCenter' }}
        flexWrap={{ default: 'nowrap' }}
        style={{ width: '100%' }}
      >
        <FlexItem className="pf-v6-u-m-0">
          <Truncate content={label} />
        </FlexItem>
        <FlexItem className="pf-v6-u-mr-xs">
          <RemoveButton onChange={onChange} navResources={navResources} resourceRef={resourceRef} />
        </FlexItem>
      </Flex>
    </NavItemResource>
  );
};

export default PinnedResource;
