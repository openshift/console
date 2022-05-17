import * as React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import * as classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon, GripVerticalIcon } from '@patternfly/react-icons';
import { K8sModel, modelFor } from '../../module/k8s';
import confirmNavUnpinModal from './confirmNavUnpinModal';

import './PinnedResource.scss';
import { NavLinkComponent } from './NavLink';
import { NavLinkRoot } from './NavLinkRoot';
import { NavLinkResourceNS } from './NavLinkResourceNS';
import { NavLinkResourceCluster } from './NavLinkResourceCluster';

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

const DraggableButton: React.FC<DraggableButtonProps> = ({ dragRef }) => {
  const { t } = useTranslation();
  return (
    <Button
      ref={dragRef}
      className="oc-pinned-resource__drag-button"
      variant="link"
      type="button"
      aria-label={t('public~Drag to reorder')}
    >
      <GripVerticalIcon className="oc-pinned-resource__drag-icon" />
    </Button>
  );
};

const RemoveButton: React.FC<RemoveButtonProps> = ({ resourceRef, navResources, onChange }) => {
  const { t } = useTranslation();
  const unPin = (e: React.MouseEvent<HTMLButtonElement>, navItem: string) => {
    e.preventDefault();
    e.stopPropagation();
    confirmNavUnpinModal(navItem, navResources, onChange);
  };
  return (
    <Button
      className="oc-pinned-resource__unpin-button"
      variant="link"
      aria-label={t('public~Unpin')}
      onClick={(e) => unPin(e, resourceRef)}
    >
      <MinusCircleIcon className="oc-pinned-resource__delete-icon" />
    </Button>
  );
};

const reorder = (list: string[], startIndex: number, destIndex: number) => {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(destIndex, 0, removed);
  return result;
};

const PinnedResource: React.FC<PinnedResourceProps> = ({
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

  const model = modelFor(resourceRef);
  if (!model) {
    return null;
  }
  const { apiVersion, apiGroup, namespaced, crd, plural } = model;

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
  const props = {
    key: `pinned-${resourceRef}`,
    name: label,
    resource: crd ? resourceRef : plural,
    tipText: duplicates ? `${label}: ${apiGroup || 'core'}/${apiVersion}` : null,
    id: resourceRef,
  };
  const Component: NavLinkComponent = namespaced ? NavLinkResourceNS : NavLinkResourceCluster;
  const previewRef = draggable ? (node: React.ReactElement) => preview(drop(node)) : null;
  return (
    <NavLinkRoot
      dragRef={previewRef}
      data-test={draggable ? 'draggable-pinned-resource-item' : 'pinned-resource-item'}
      className={classNames('oc-pinned-resource', {
        'oc-pinned-resource--dragging': draggable && isOver,
      })}
      component={Component}
      insertBeforeName={draggable ? <DraggableButton dragRef={drag} /> : null}
      {...props}
    >
      <RemoveButton onChange={onChange} navResources={navResources} resourceRef={resourceRef} />
    </NavLinkRoot>
  );
};

export default PinnedResource;
