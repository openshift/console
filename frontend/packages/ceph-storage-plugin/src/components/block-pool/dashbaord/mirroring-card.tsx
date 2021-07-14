import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { StatusIconAndText } from '@console/shared';
import { ChartPie, ChartThemeColor } from '@patternfly/react-charts';
import { ExpandableSection } from '@patternfly/react-core';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import * as dateTime from '@console/internal/components/utils/datetime';
import { humanizePercentage } from '@console/internal/components/utils';

import { StoragePoolKind } from 'packages/ceph-storage-plugin/src/types';
import { BlockPoolDashboardContext } from './block-pool-dashboard-context';
import { healthStateMapping, ImageStateLegendMap } from '../states';

const MirroringImageHealthChart: React.FC<StoragePoolKind> = (obj: StoragePoolKind) => {
  const { t } = useTranslation();

  const states: any = obj.status?.mirroringStatus?.summary?.states ?? {};
  const totalImageCount = Object.keys(states).reduce((sum, state) => sum + states[state], 0);

  if (totalImageCount > 0) {
    const data = Object.keys(states).map((state) => ({
      x: ImageStateLegendMap[state],
      y: humanizePercentage((states[state] * 100) / totalImageCount).string,
    }));
    const legendData = Object.keys(states).map((state) => ({
      name: `${ImageStateLegendMap[state]}: ${
        humanizePercentage((states[state] * 100) / totalImageCount).string
      }`,
    }));

    return (
      <div>
        <ChartPie
          ariaTitle={t('ceph-storage-plugin~Image States')}
          constrainToVisibleArea
          data={data}
          labels={({ datum }) => `${datum.x}: ${datum.y}`}
          legendData={legendData}
          legendOrientation="vertical"
          legendPosition="right"
          height={220}
          width={300}
          padding={{
            right: 160,
          }}
          themeColor={ChartThemeColor.multi}
        />
      </div>
    );
  }
  return <></>;
};

export const MirroringCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);

  const mirroringStatus: boolean = obj.spec?.mirroring?.enabled;
  const mirroringImageHealth: string = obj.status?.mirroringStatus?.summary?.image_health;
  const lastChecked: string = obj.status?.mirroringStatus?.lastChecked;
  const formatedDateTime = lastChecked
    ? dateTime.twelveHoursdateTimeNoYear.format(new Date(lastChecked))
    : '';

  return (
    <DashboardCard data-test-id="mirroring-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Mirroring')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Mirroring Status')}>
            {mirroringStatus ? t('ceph-storage-plugin~Enabled') : t('ceph-storage-plugin~Disabled')}
          </DetailItem>
          {mirroringStatus && (
            <>
              <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Overall Image Health')}>
                <StatusIconAndText
                  title={mirroringImageHealth}
                  icon={healthStateMapping[mirroringImageHealth].icon}
                />
              </DetailItem>
              <ExpandableSection toggleText={t('ceph-storage-plugin~Show image states')}>
                <MirroringImageHealthChart {...obj} />
              </ExpandableSection>
              <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Last Checked')}>
                {formatedDateTime}
              </DetailItem>
            </>
          )}
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};
