import * as React from 'react';
import * as classNames from 'classnames';
import { Badge } from '@patternfly/react-core';

export const ResourceStatus: React.FC<ResourceStatusProps> = ({
  additionalClassNames,
  badgeAlt,
  children,
}) => {
  return (
    <span className={classNames('co-resource-item__resource-status', additionalClassNames)}>
      <Badge
        className={classNames('co-resource-item__resource-status-badge', {
          'co-resource-item__resource-status-badge--alt': badgeAlt,
        })}
        isRead
      >
        {children}
      </Badge>
    </span>
  );
};

type ResourceStatusProps = {
  additionalClassNames?: string;
  badgeAlt?: boolean;
  children: React.ReactNode;
};
