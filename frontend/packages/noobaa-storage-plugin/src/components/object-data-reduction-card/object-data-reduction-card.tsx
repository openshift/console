import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { PrometheusResponse } from '@console/shared/src/types/monitoring';
import { getGaugeValue } from '../../utils';
import { ObjectDataReductionQueries } from '../../queries';
import { EfficiencyItem, SavingsItem } from './object-data-reduction-card-item';
import './object-data-reduction-card.scss';

const DataReductionCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    Object.keys(ObjectDataReductionQueries).forEach((key) =>
      watchPrometheus(ObjectDataReductionQueries[key]),
    );
    return () =>
      Object.keys(ObjectDataReductionQueries).forEach((key) =>
        stopWatchPrometheusQuery(ObjectDataReductionQueries[key]),
      );
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const efficiencyQueryResult = prometheusResults.getIn([
    ObjectDataReductionQueries.EFFICIENCY_QUERY,
    'data',
  ]) as PrometheusResponse;
  const efficiencyQueryResultError = prometheusResults.getIn([
    ObjectDataReductionQueries.EFFICIENCY_QUERY,
    'loadError',
  ]);

  const savingsQueryResult = prometheusResults.getIn([
    ObjectDataReductionQueries.SAVINGS_QUERY,
    'data',
  ]) as PrometheusResponse;
  const savingsQueryResultError = prometheusResults.getIn([
    ObjectDataReductionQueries.SAVINGS_QUERY,
    'loadError',
  ]);

  const logicalSavingsQueryResult = prometheusResults.getIn([
    ObjectDataReductionQueries.LOGICAL_SAVINGS_QUERY,
    'data',
  ]) as PrometheusResponse;
  const logicalSavingsQueryResultError = prometheusResults.getIn([
    ObjectDataReductionQueries.LOGICAL_SAVINGS_QUERY,
    'loadError',
  ]);

  const efficiency = getGaugeValue(efficiencyQueryResult);
  const savings = getGaugeValue(savingsQueryResult);
  const logicalSize = getGaugeValue(logicalSavingsQueryResult);

  const efficiencyProps = {
    efficiency,
    isLoading: !efficiencyQueryResult,
    error: !!efficiencyQueryResultError,
  };

  const savingsProps = {
    savings,
    logicalSize,
    isLoading: !savingsQueryResult && !logicalSavingsQueryResult,
    error: !!savingsQueryResultError || !!logicalSavingsQueryResultError,
  };

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Object Data Reduction</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody className="co-dashboard-card__body--no-padding">
        <EfficiencyItem {...efficiencyProps} />
        <SavingsItem {...savingsProps} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(DataReductionCard);
