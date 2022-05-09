import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewDetailItem as OverviewDetailItemShared } from '@openshift-console/plugin-shared';

/* The value of an added item to the Details dashboard-card on the Overview page */
const OverviewDetailItem: React.FC = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');

  return (
    <>
      <OverviewDetailItemShared
        title={t('Added title')}
        isLoading={false}
        valueClassName="co-select-to-copy"
      >
        {t('My value')}
      </OverviewDetailItemShared>
      <OverviewDetailItemShared
        title={t('Added title - error')}
        isLoading={false}
        error={t('Error text')}
        valueClassName="co-select-to-copy"
      >
        {t('My value')}
      </OverviewDetailItemShared>
    </>
  );
};

export default OverviewDetailItem;
