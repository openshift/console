import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getUsedPercentage } from '@console/app/src/components/resource-quota/utils';
import { YellowExclamationTriangleIcon } from '../../status';

import './quota-summary.scss';

type QuotaSummaryProps = {
  hard: { [key: string]: string };
  used: { [key: string]: string };
};

const QuotaSummary = ({ hard, used }: QuotaSummaryProps): JSX.Element => {
  const { t } = useTranslation();
  const resourcesAtQuota = Object.keys(hard || {}).reduce(
    (acc, resource) => (getUsedPercentage(hard[resource], used?.[resource]) >= 100 ? acc + 1 : acc),
    0,
  );

  return (
    <div className="co-resource-quota__summary">
      {t('console-shared~{{count}} resource', { count: Object.keys(hard || {}).length })}
      {', '}
      {resourcesAtQuota > 0 ? (
        <>
          <YellowExclamationTriangleIcon />{' '}
          {t('console-shared~{{count}} resource reached quota', { count: resourcesAtQuota })}
        </>
      ) : (
        t('console-shared~none are at quota')
      )}
    </div>
  );
};

export default QuotaSummary;
