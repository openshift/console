import type { FC } from 'react';
import { useRef, useEffect } from 'react';
import { css } from '@patternfly/react-styles';
import type {
  Node,
  WithContextMenuProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import { DefaultGroup, observer, useCombineRefs, useHover } from '@patternfly/react-topology';
import { useSearchFilter } from '../../../../filters';
import { useShowLabel } from '../../../../filters/useShowLabel';
import { ApplicationModel } from '../../../../models';
import { SHOW_GROUPING_HINT_EVENT } from '../../../../topology-types';
import { getKindStringAndAbbreviation } from '../nodes/nodeUtils';
import RegroupHint from '../RegroupHint';
import GroupNode from './GroupNode';

import './Application.scss';

type ApplicationProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
  dragRegroupable?: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithDragNodeProps &
  WithContextMenuProps;

const Application: FC<ApplicationProps> = ({
  element,
  dragNodeRef,
  canDrop,
  dropTarget,
  dragRegroupable,
  contextMenuOpen,
  ...others
}) => {
  const [hover, hoverRef] = useHover();
  const refs = useCombineRefs(dragNodeRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const showLabel = useShowLabel(hover);
  const needsHintRef = useRef<boolean>(false);
  useEffect(() => {
    const needsHint = dropTarget && !canDrop && dragRegroupable;
    if (needsHint !== needsHintRef.current) {
      needsHintRef.current = needsHint;
      element
        .getController()
        .fireEvent(SHOW_GROUPING_HINT_EVENT, element, needsHint ? <RegroupHint /> : null);
    }
  }, [dropTarget, canDrop, element, dragRegroupable]);
  const { kindAbbr, kindStr, kindColor } = getKindStringAndAbbreviation(ApplicationModel.kind);
  const badgeClassName = css('odc-resource-icon', {
    [`odc-resource-icon-${kindStr.toLowerCase()}`]: !kindColor,
  });

  const groupClasses = css('odc-application-group', {
    'is-filtered': filtered,
  });

  if (element.isCollapsed()) {
    return (
      <GroupNode
        bgClassName="odc-application-group__bg"
        element={element}
        canDrop={canDrop}
        dropTarget={dropTarget}
        badge={kindAbbr}
        badgeColor={kindColor}
        badgeClassName={badgeClassName}
        dragNodeRef={refs}
        contextMenuOpen={contextMenuOpen}
        {...others}
      />
    );
  }

  return (
    <DefaultGroup
      className={groupClasses}
      element={element}
      canDrop={canDrop}
      dropTarget={dropTarget}
      dragNodeRef={refs}
      badge={kindAbbr}
      badgeColor={kindColor}
      badgeClassName={badgeClassName}
      showLabel={showLabel || contextMenuOpen}
      showLabelOnHover
      contextMenuOpen={contextMenuOpen}
      {...others}
    />
  );
};

export default observer(Application);
