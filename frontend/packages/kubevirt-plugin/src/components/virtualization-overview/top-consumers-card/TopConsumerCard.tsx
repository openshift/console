import * as React from 'react';
import { Card, SelectOption, SelectVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TopConsumerMetric } from '../../../constants/virt-overview/top-consumers-card/top-consumer-metric';
import { TopConsumerScope } from '../../../constants/virt-overview/top-consumers-card/top-consumer-scope';
import { FormPFSelect } from '../../form/form-pf-select';
import { TopConsumersChartList } from './TopConsumersChartList';

import './top-consumers-card.scss';

type TopConsumersMetricCard = {
  numItemsToShow: number;
  initialMetric?: TopConsumerMetric;
};

export const TopConsumerCard: React.FC<TopConsumersMetricCard> = ({
  numItemsToShow,
  initialMetric,
}) => {
  const { t } = useTranslation();
  const [metricValue, setMetricValue] = React.useState(initialMetric || TopConsumerMetric.CPU);
  const [scopeValue, setScopeValue] = React.useState(TopConsumerScope.VM);

  const onMetricSelect = (value) => setMetricValue(TopConsumerMetric.fromDropdownLabel(value));
  const onScopeSelect = (value) => setScopeValue(TopConsumerScope.fromDropdownLabel(value));

  return (
    <Card className="co-overview-card--gradient kv-top-consumers-card__metric-card">
      <div className="kv-top-consumer-card__header">
        <div>
          <FormPFSelect
            toggleId="kv-top-consumers-card-metric-select"
            variant={SelectVariant.single}
            selections={t(metricValue.getDropdownLabel())}
            onSelect={(e, value) => onMetricSelect(value)}
            isCheckboxSelectionBadgeHidden
          >
            {TopConsumerMetric.getAll().map((metric) => (
              <SelectOption key={metric.getValue()} value={t(metric.getDropdownLabel())} />
            ))}
          </FormPFSelect>
        </div>
        <div className="kv-top-consumers-card__scope-select">
          <FormPFSelect
            toggleId="kv-top-consumers-card-scope-select"
            variant={SelectVariant.single}
            selections={t(scopeValue.getDropdownLabel())}
            onSelect={(e, value) => onScopeSelect(value)}
            isCheckboxSelectionBadgeHidden
          >
            {TopConsumerScope.getAll().map((scope) => (
              <SelectOption key={scope.getValue()} value={t(scope.getDropdownLabel())} />
            ))}
          </FormPFSelect>
        </div>
      </div>
      <div className="kv-top-consumers-card__chart-header">
        <div>{t('kubevirt-plugin~Resource')}</div>
        <div>{t('kubevirt-plugin~Usage')}</div>
      </div>
      <TopConsumersChartList numItems={numItemsToShow} metric={metricValue} scope={scopeValue} />
    </Card>
  );
};
