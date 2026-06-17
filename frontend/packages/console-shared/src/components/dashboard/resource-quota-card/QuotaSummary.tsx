import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsedPercentage } from '@console/app/src/components/resource-quota/utils';
import { YellowExclamationTriangleIcon } from '../../status/icons';

import './quota-summary.scss';

type QuotaSummaryProps = {
  hard: { [key: string]: string };
  used: { [key: string]: string };
};

const QuotaSummary: FC<QuotaSummaryProps> = ({ hard, used }) => {
  const { t } = useTranslation('console-shared');
  const resourcesAtQuota = Object.keys(hard || {}).reduce(
    (acc, resource) => (getUsedPercentage(hard[resource], used?.[resource]) >= 100 ? acc + 1 : acc),
    0,
  );

  return (
    <div className="co-resource-quota__summary">
      {t('{{count}} resource', { count: Object.keys(hard || {}).length })}
      {', '}
      {resourcesAtQuota > 0 ? (
        <>
          <YellowExclamationTriangleIcon />{' '}
          {t('{{count}} resource reached quota', { count: resourcesAtQuota })}
        </>
      ) : (
        t('none are at quota')
      )}
    </div>
  );
};

export default QuotaSummary;
