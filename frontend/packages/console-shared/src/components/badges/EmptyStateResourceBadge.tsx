import * as React from 'react';
import { Badge } from '@patternfly/react-core';
import { K8sKind, kindToAbbr } from '@console/internal/module/k8s';
import './EmptyStateResourceBadge.scss';

type EmptyStateResourceBadgeProps = {
  model: K8sKind;
};

const EmptyStateResourceBadge: React.FC<EmptyStateResourceBadgeProps> = ({ model }) => (
  <div className="ocs-empty-state-resource-badge">
    <Badge className="ocs-empty-state-resource-badge--badge" isRead>
      {model.abbr || kindToAbbr(model.kind)}
    </Badge>
  </div>
);

export default EmptyStateResourceBadge;
