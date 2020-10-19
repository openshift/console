import * as React from 'react';

export const GraphEmpty: React.FC<GraphEmptyProps> = ({ height = 180, loading = false }) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      height,
      justifyContent: 'center',
      padding: '5px',
      width: '100%',
      flexGrow: 1,
    }}
  >
    {loading ? (
      <div className="skeleton-chart" />
    ) : (
      <div className="text-secondary">No datapoints found.</div>
    )}
  </div>
);

type GraphEmptyProps = {
  height?: number | string;
  loading?: boolean;
};
