import * as React from 'react';
import { EmptyState, EmptyStateVariant, Title } from '@patternfly/react-core';

export const GraphEmpty: React.FC<GraphEmptyProps> = ({ height = 180, loading = false }) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      height,
      justifyContent: 'center',
      padding: '5px',
      width: '100%',
    }}
  >
    {loading ? (
      <div className="skeleton-chart" />
    ) : (
      <EmptyState variant={EmptyStateVariant.full}>
        <Title className="graph-empty-state__title text-secondary" size="sm">
          No datapoints found.
        </Title>
      </EmptyState>
    )}
  </div>
);

type GraphEmptyProps = {
  height?: number | string;
  loading?: boolean;
};
