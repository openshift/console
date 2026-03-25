import type { FC, MouseEvent, ReactElement } from 'react';
import { Button } from '@patternfly/react-core';
import { GripVerticalIcon } from '@patternfly/react-icons/dist/esm/icons/grip-vertical-icon';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { css } from '@patternfly/react-styles';
import { debounce } from 'lodash';
import { useDrag, useDrop } from 'react-dnd';
import { useTranslation } from 'react-i18next';
import type { K8sModel } from '@console/internal/module/k8s';
import { modelFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import './PinnedResource.scss';
import { NavItemResource } from './NavItemResource';
import useConfirmNavUnpinModal from './useConfirmNavUnpinModal';

type PinnedResourceProps = {
  resourceRef?: string;
  navResources?: string[];
  onChange?: (pinnedResources: string[]) => void;
  idx?: number;
  draggable?: boolean;
  onReorder?: (pinnedResources: string[]) => void;
  onDrag?: (dragging: boolean) => void;
};

type DraggableButtonProps = {
  dragRef?: (node) => void | null;
};

type RemoveButtonProps = {
  resourceRef?: string;
  navResources?: string[];
  onChange?: (pinnedResources: string[]) => void;
};

export type DragItem = {
  idx: number;
  id: string;
  type: string;
};

const DraggableButton: FC<DraggableButtonProps> = ({ dragRef }) => {
  const { t } = useTranslation();
  return (
    <Button
      icon={<GripVerticalIcon className="oc-pinned-resource__drag-icon" />}
      ref={dragRef}
      className="oc-pinned-resource__drag-button"
      variant="link"
      type="button"
      aria-label={t('console-app~Drag to reorder')}
    />
  );
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
      icon={<MinusCircleIcon className="oc-pinned-resource__delete-icon" />}
      className="oc-pinned-resource__unpin-button"
      variant="link"
      aria-label={t('console-app~Unpin')}
      onClick={(e) => unPin(e, resourceRef)}
    />
  );
};

const reorder = (list: string[], startIndex: number, destIndex: number) => {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(destIndex, 0, removed);
  return result;
};

const PinnedResource: FC<PinnedResourceProps> = ({
  resourceRef,
  onChange,
  navResources,
  idx,
  draggable,
  onReorder,
  onDrag,
}) => {
  const { t } = useTranslation();
  const [, drag, preview] = useDrag({
    item: { type: 'NavItem', id: `NavItem-${idx}`, idx },
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        onDrag(false);
      }
    },
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'NavItem',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: debounce((item: DragItem) => {
      if (item.idx === idx) {
        return;
      }
      onReorder(reorder(navResources, item.idx, idx));
      // monitor item updated here to avoid expensive index searches.
      item.idx = idx;
      onDrag(true);
    }, 10),
    drop() {
      onChange(navResources); // update user-settings when the resource is dropped
      onDrag(false);
    },
  });

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
  const previewRef = draggable ? (node: ReactElement) => preview(drop(node)) : null;
  return (
    <NavItemResource
      key={`pinned-${resourceRef}`}
      namespaced={namespaced}
      title={duplicates ? `${label}: ${apiGroup || 'core'}/${apiVersion}` : null}
      model={{ group: apiGroup, version: apiVersion, kind }}
      id={resourceRef}
      dragRef={previewRef}
      dataAttributes={{
        'data-test': draggable ? 'draggable-pinned-resource-item' : 'pinned-resource-item',
      }}
      className={css('oc-pinned-resource', {
        'oc-pinned-resource--dragging': draggable && isOver,
      })}
    >
      {draggable ? <DraggableButton dragRef={drag} /> : null}
      {label}
      <RemoveButton onChange={onChange} navResources={navResources} resourceRef={resourceRef} />
    </NavItemResource>
  );
};

export default PinnedResource;
