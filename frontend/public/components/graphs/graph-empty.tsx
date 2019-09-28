import * as React from 'react';
import { EmptyState, EmptyStateVariant, Title } from '@patternfly/react-core';
import { LoadingBox } from '../utils';

export const GraphEmpty: React.FC<GraphEmptyProps> = ({ height = 180, loading = false }) => (
  <div
    style={{
      height,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {loading ? (
      <LoadingBox />
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
