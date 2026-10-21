import type { FC } from 'react';
import { Badge } from '@patternfly/react-core';
import type { K8sKind } from '@console/internal/module/k8s';
import { kindToAbbr } from '@console/internal/module/k8s';
import './EmptyStateResourceBadge.scss';

type EmptyStateResourceBadgeProps = {
  model: K8sKind;
};

const EmptyStateResourceBadge: FC<EmptyStateResourceBadgeProps> = ({ model }) => (
  <div className="ocs-empty-state-resource-badge">
    <Badge className="ocs-empty-state-resource-badge--badge" isRead>
      {model.abbr || kindToAbbr(model.kind)}
    </Badge>
  </div>
);

export default EmptyStateResourceBadge;
