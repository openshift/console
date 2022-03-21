import * as React from 'react';
import {
  Node,
  observer,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithContextMenuProps,
  useHover,
  useCombineRefs,
} from '@patternfly/react-topology';
import classNames from 'classnames';
import { useSearchFilter } from '../../../../filters';
import { useShowLabel } from '../../../../filters/useShowLabel';
import { ApplicationModel } from '../../../../models';
import { SHOW_GROUPING_HINT_EVENT } from '../../../../topology-types';
import { getKindStringAndAbbreviation } from '../nodes/nodeUtils';
import RegroupHint from '../RegroupHint';
import ApplicationGroupExpanded from './ApplicationGroupExpanded';
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

const Application: React.FC<ApplicationProps> = ({
  element,
  dragNodeRef,
  canDrop,
  dropTarget,
  dragRegroupable,
  ...others
}) => {
  const [hover, hoverRef] = useHover();
  const refs = useCombineRefs(dragNodeRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const needsHintRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    const needsHint = dropTarget && !canDrop && dragRegroupable;
    if (needsHint !== needsHintRef.current) {
      needsHintRef.current = needsHint;
      element
        .getController()
        .fireEvent(SHOW_GROUPING_HINT_EVENT, element, needsHint ? <RegroupHint /> : null);
    }
  }, [dropTarget, canDrop, element, dragRegroupable]);
  const showLabel = useShowLabel(hover);
  const { kindAbbr, kindStr, kindColor } = getKindStringAndAbbreviation(ApplicationModel.kind);
  const badgeClassName = classNames('odc-resource-icon', {
    [`odc-resource-icon-${kindStr.toLowerCase()}`]: !kindColor,
  });

  const groupClasses = classNames('odc-application-group', {
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
        {...others}
      />
    );
  }

  // Use local version of DefaultGroupExpanded until we have a fix for https://github.com/patternfly/patternfly-react/issues/7300
  return (
    <ApplicationGroupExpanded
      className={groupClasses}
      showLabel={showLabel}
      element={element}
      canDrop={canDrop}
      dropTarget={dropTarget}
      dragNodeRef={refs}
      badge={kindAbbr}
      badgeColor={kindColor}
      badgeClassName={badgeClassName}
      {...others}
    />
  );
};

export default observer(Application);
