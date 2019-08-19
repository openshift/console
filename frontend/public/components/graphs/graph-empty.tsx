import * as React from 'react';
import { ChartAreaIcon } from '@patternfly/react-icons';
import { EmptyStateIcon, EmptyState, EmptyStateVariant, Title } from '@patternfly/react-core';
import { LoadingBox } from '../utils';

export const GraphEmpty: React.FC<GraphEmptyProps> = ({height = 180, icon = ChartAreaIcon, loading = false}) => <div style={{minHeight:height, width: '100%'}} >
  {
    loading ? <LoadingBox /> : (
      <EmptyState className="graph-empty-state" variant={EmptyStateVariant.full}>
        <EmptyStateIcon size="sm" icon={icon} />
        <Title size="sm">No datapoints found.</Title>
      </EmptyState>
    )
  }
</div>;

type GraphEmptyProps = {
  icon?: React.SFC<any>;
  height?: number;
  loading?: boolean;
}
