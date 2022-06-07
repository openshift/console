import * as React from 'react';
import { ChartDonut } from '@patternfly/react-charts';
import { Card, CardBody, CardHeader, CardTitle, TitleSizes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useRunningVMsPerTemplateChartData } from '../../../hooks/useRunningVMsPerTemplateChartData';
import { EmptyStateNoVMs } from '../../EmptyState/EmptyStateNoVMs';
import { VMsChartLegend } from './RunningVMsChartLegend';

import './running-vms-per-template-card.scss';

export const RunningVMsPerTemplateCard = () => {
  const { t } = useTranslation();
  const [chartData, legendItems, numVMs] = useRunningVMsPerTemplateChartData();

  const chart = (
    <div>
      <ChartDonut
        ariaDesc={t('kubevirt-plugin~Running VMs per template')}
        ariaTitle={t('kubevirt-plugin~Running VMs per template donut chart')}
        data={chartData}
        height={150}
        labels={({ datum }) => `${datum.x}: ${datum.y}%`}
        legendPosition="bottom"
        padding={{
          bottom: 20,
          left: 20,
          right: 20,
          top: 20,
        }}
        subTitle={t('kubevirt-plugin~VMs')}
        title={numVMs?.toString()}
        width={300}
        style={{
          data: {
            fill: ({ datum }) => datum.fill,
          },
        }}
      />
    </div>
  );

  return (
    <Card className="kv-running-vms-card__gradient" data-test-id="kv-running-vms-per-template-card">
      <CardHeader>
        <CardTitle>{t('kubevirt-plugin~Running VMs per template')}</CardTitle>
      </CardHeader>
      <CardBody>
        {numVMs ? (
          <>
            {chart}
            <VMsChartLegend legendItems={legendItems} />
          </>
        ) : (
          <EmptyStateNoVMs titleSize={TitleSizes.md} className="kv-running-vms-card__empty-state" />
        )}
      </CardBody>
    </Card>
  );
};
