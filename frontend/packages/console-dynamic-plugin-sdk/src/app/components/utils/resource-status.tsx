import type { ReactNode, FC } from 'react';
import { Badge } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import './resource-status.scss';

type ResourceStatusProps = {
  additionalClassNames?: string;
  badgeAlt?: boolean;
  children: ReactNode;
};

/**
 * Component for displaying resource status badge.
 * Use this component to display status of given resource.
 * It accepts child element to be rendered inside the badge.
 * @component ResourceStatus
 * @example
 * ```ts
 * return (
 *  <ResourceStatus>
 *    <Status status={resourceStatus} />
 *  </ResourceStatus>
 * )
 * ```
 */
const ResourceStatus: FC<ResourceStatusProps> = ({
  additionalClassNames,
  badgeAlt,
  children,
}) => {
  return (
    <span className={css('dps-resource-item__resource-status', additionalClassNames)}>
      <Badge
        className={css('dps-resource-item__resource-status-badge', {
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
