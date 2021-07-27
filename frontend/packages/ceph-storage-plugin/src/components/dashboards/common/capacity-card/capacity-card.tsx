import * as React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { ChartDonut, ChartLabel } from '@patternfly/react-charts';
import { global_warning_color_100 as globalWarning100 } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { global_danger_color_100 as globalDanger100 } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import { FieldLevelHelp, humanizeBinaryBytes } from '@console/internal/components/utils';
import {
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared/src/components/status/icons';
import { DANGER_THRESHOLD, WARNING_THRESHOLD } from '../capacity-breakdown/consts';
import './capacity-card.scss';

const generalColorScale = ['#0166cc', '#d6d6d6'];
const warningColorScale = [globalWarning100.value, '#d6d6d6'];
const dangerColorScale = [globalDanger100.value, '#d6d6d6'];

const CapacityStatusIcon: React.FC<CapacityStatusIconProps> = React.memo(({ ratio }) => {
  const { t } = useTranslation();
  if (ratio < WARNING_THRESHOLD) return null;
  return (
    <>
      {ratio > DANGER_THRESHOLD && (
        <RedExclamationCircleIcon title={t('ceph-storage-plugin~Error')} />
      )}
      {ratio > WARNING_THRESHOLD && ratio <= DANGER_THRESHOLD && (
        <YellowExclamationTriangleIcon title={t('ceph-storage-plugin~Warning')} />
      )}
    </>
  );
});

// Generic capacity card
export const CapacityCard: React.FC<CapacityCardProps> = React.memo((props) => {
  const {
    totalCapacityMetric,
    availableCapacityMetric,
    usedCapacityMetric,
    description,
    loadError,
    loading,
  } = props;
  const { t } = useTranslation();

  const totalCapacity = humanizeBinaryBytes(totalCapacityMetric);
  const availableCapacity = humanizeBinaryBytes(availableCapacityMetric, null, totalCapacity?.unit);
  const usedCapacity = humanizeBinaryBytes(usedCapacityMetric, null, totalCapacity?.unit);

  // Adjusted units
  const usedCapacityAdjusted = humanizeBinaryBytes(usedCapacityMetric);
  const availableCapacityAdjusted = humanizeBinaryBytes(totalCapacityMetric - usedCapacityMetric);
  const capacityRatio = parseFloat((usedCapacity.value / totalCapacity.value).toFixed(2));

  const colorScale = React.useMemo(() => {
    if (capacityRatio > DANGER_THRESHOLD) return dangerColorScale;
    if (capacityRatio > WARNING_THRESHOLD && capacityRatio <= DANGER_THRESHOLD)
      return warningColorScale;
    return generalColorScale;
  }, [capacityRatio]);

  const donutData = [
    { x: 'Used', y: usedCapacity.value, string: usedCapacityAdjusted.string },
    {
      x: 'Available',
      y: availableCapacity.value,
      string: availableCapacityAdjusted.string,
    },
  ];

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          {t('ceph-storage-plugin~Raw capacity')}
          <FieldLevelHelp>{description}</FieldLevelHelp>
        </DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody className="ceph-raw-usage__container">
        {!loading && !loadError && (
          <>
            <div className="ceph-raw-usage__item ceph-raw-usage__legend">
              <ChartLegend
                fill={colorScale[0]}
                title={t('ceph-storage-plugin~Used')}
                text={usedCapacityAdjusted.string}
                titleClassName="ceph-raw-card-legend__title--pad"
              />
              <ChartLegend
                fill={colorScale[1]}
                title={t('ceph-storage-plugin~Available')}
                text={availableCapacityAdjusted.string}
                capacityStatus={<CapacityStatusIcon ratio={capacityRatio} />}
              />
            </div>
            <div className="ceph-raw-usage__item ceph-raw-usage__chart">
              <ChartDonut
                ariaDesc={t('ceph-storage-plugin~Available versus Used Capacity')}
                ariaTitle={t('ceph-storage-plugin~Available versus Used Capacity')}
                height={150}
                width={150}
                data={donutData}
                labels={({ datum }) => `${datum.string}`}
                title={usedCapacityAdjusted.string}
                subTitle={t('ceph-storage-plugin~Used of {{capacity}}', {
                  capacity: totalCapacity.string,
                })}
                colorScale={colorScale}
                padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
                constrainToVisibleArea
                subTitleComponent={
                  <ChartLabel dy={5} style={{ fill: `var(--pf-global--palette--black-500)` }} />
                }
              />
            </div>
          </>
        )}
        {loading && !loadError && <LoadingCardBody />}
        {loadError && <ErrorCardBody />}
      </DashboardCardBody>
    </DashboardCard>
  );
});

const LoadingCardBody: React.FC = () => (
  <div className="ceph-raw-usage__container">
    <div className="ceph-raw-usage-loading__legend">
      <div className="ceph-raw-usage-loading-legend__item skeleton-activity" />
      <div className="ceph-raw-usage-loading-legend__item skeleton-activity" />
    </div>
    <div className="ceph-raw-usage-loading__chart skeleton-activity" />
  </div>
);

const ErrorCardBody: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="ceph-raw-usage--error text-muted">
        {t('ceph-storage-plugin~Not Available')}
      </div>
    </>
  );
};

const ChartLegend: React.FC<ChartLegendProps> = ({
  fill,
  title,
  text,
  titleClassName,
  capacityStatus,
}) => {
  return (
    <div className="ceph-raw-card-legend__container">
      <div className="ceph-raw-card-legend__index-block">
        <div className="ceph-raw-card-legend__color-square" style={{ backgroundColor: fill }} />
        <div className={classNames('ceph-raw-card-legend__title', titleClassName)}>{title}</div>
      </div>
      <div className="ceph-raw-card-legend__value-block">
        <div className="ceph-raw-card-legend__text">{text}</div>
      </div>
      {capacityStatus && <div className="ceph-raw-card-legend__icon-block">{capacityStatus}</div>}
    </div>
  );
};

export type CapacityCardProps = {
  totalCapacityMetric: number;
  usedCapacityMetric: number;
  availableCapacityMetric: number;
  description: string;
  loading: boolean;
  loadError: boolean;
};

type ChartLegendProps = {
  fill: string;
  text: string;
  title: string;
  titleClassName?: string;
  capacityStatus?: JSX.Element;
};

type CapacityStatusIconProps = {
  ratio: number;
};
