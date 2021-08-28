import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const GraphEmpty: React.FC<GraphEmptyProps> = ({ height = 180, loading = false, query }) => {
  const { t } = useTranslation();
  if (!loading) {
    /* eslint-disable no-console */
    console.log('---> Query:', query);
    /* eslint-enable no-console */
  }
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
        <div className="skeleton-chart" data-test="skeleton-chart" />
      ) : (
        <div className="text-secondary">{t('public~No datapoints found.')}</div>
      )}
    </div>
  );
};

type GraphEmptyProps = {
  height?: number | string;
  loading?: boolean;
  query?: string | string[];
};
