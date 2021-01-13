import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const GraphEmpty: React.FC<GraphEmptyProps> = ({ height = 180, loading = false }) => {
  const { t } = useTranslation();

  return (
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
        <div className="text-secondary">{t('public~No datapoints found.')}</div>
      )}
    </div>
  );
};

type GraphEmptyProps = {
  height?: number | string;
  loading?: boolean;
};
