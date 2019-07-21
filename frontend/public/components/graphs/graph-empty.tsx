import * as React from 'react';
import { ChartAreaIcon } from '@patternfly/react-icons';
import { EmptyStateIcon, EmptyState, EmptyStateVariant, Title } from '@patternfly/react-core';
import { LoadingBox } from '../utils';

export const GraphEmpty: React.FC<GraphEmptyProps> = ({height = 180, icon = ChartAreaIcon, loading = false}) => loading ? (
  <div style={{height, width: '100%'}} >
    <LoadingBox />
  </div>
) : (
  <EmptyState className="graph-empty-state" variant={EmptyStateVariant.full} >
    <EmptyStateIcon size="sm" icon={icon} />
    <Title size="sm">No datapoints found.</Title>
  </EmptyState>
);

type GraphEmptyProps = {
  icon?: React.SFC<any>;
  height?: number;
  loading?: boolean;
}
