import * as React from 'react';
import { Badge } from '@patternfly/react-core';
import * as classNames from 'classnames';
import './resource-status.scss';

type ResourceStatusProps = {
  additionalClassNames?: string;
  badgeAlt?: boolean;
  children: React.ReactNode;
};

/**
 * Component for displaying resource status badge.
 * Use this component to display status of given resource.
 * It accepts child element to be rendered inside the badge.
 * @component ResourceStatus
 * @example
 * ```ts
 * return (
 *  <ResourceStatus additionalClassNames="hidden-xs">
 *    <Status status={resourceStatus} />
 *  </ResourceStatus>
 * )
 * ```
 */
export const ResourceStatus: React.FC<ResourceStatusProps> = ({
  additionalClassNames,
  badgeAlt,
  children,
}) => {
  return (
    <span className={classNames('dps-resource-item__resource-status', additionalClassNames)}>
      <Badge
        className={classNames('dps-resource-item__resource-status-badge', {
          'dps-resource-item__resource-status-badge--alt': badgeAlt,
        })}
        isRead
        data-test="resource-status"
      >
        {children}
      </Badge>
    </span>
  );
};

export default ResourceStatus;
