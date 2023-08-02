import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import {
  SelectOption as SelectOptionDeprecated,
  SelectVariant as SelectVariantDeprecated,
} from '@patternfly/react-core/deprecated';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { TopConsumerMetric } from '../../../constants/virt-overview/top-consumers-card/top-consumer-metric';
import { FormPFSelect } from '../../form/form-pf-select';
import { TopConsumersGridRow } from './TopConsumersGridRow';

import './top-consumers-card.scss';

const initialMetrics = [
  TopConsumerMetric.CPU,
  TopConsumerMetric.MEMORY,
  TopConsumerMetric.MEMORY_SWAP_TRAFFIC,
  TopConsumerMetric.VCPU_WAIT,
  TopConsumerMetric.STORAGE_THROUGHPUT,
  TopConsumerMetric.STORAGE_IOPS,
];

const topAmountSelectOptions = (t: TFunction) => [
  {
    key: 'top-5',
    value: t('kubevirt-plugin~Show top 5'),
  },
  {
    key: 'top-10',
    value: t('kubevirt-plugin~Show top 10'),
  },
];

export const VirtOverviewTopConsumersCard: React.FC = () => {
  const { t } = useTranslation();
  const [numItemsToShow, setNumItemsToShow] = React.useState('Show top 5');
  const numItemsOptionSelected = React.useMemo(() => (numItemsToShow === 'Show top 5' ? 5 : 10), [
    numItemsToShow,
  ]);

  const onTopAmountSelect = (value) => setNumItemsToShow(value);

  return (
    <div className="kv-top-consumers-card">
      <Card data-test="kv-top-consumers-card" isClickable isSelectable>
        <CardHeader
          actions={{
            actions: (
              <>
                <Link to="/monitoring/dashboards/grafana-dashboard-kubevirt-top-consumers?period=4h">
                  {t('kubevirt-plugin~View virtualization dashboard')}
                </Link>
                <div className="kv-top-consumers-card__dropdown">
                  <FormPFSelect
                    toggleId="kv-top-consumers-card-amount-select"
                    variant={SelectVariantDeprecated.single}
                    selections={numItemsToShow}
                    onSelect={(e, value) => onTopAmountSelect(value)}
                  >
                    {topAmountSelectOptions(t).map((opt) => (
                      <SelectOptionDeprecated key={opt.key} value={opt.value} />
                    ))}
                  </FormPFSelect>
                </div>
              </>
            ),
            hasNoOffset: false,
            className: 'co-overview-card__actions',
          }}
          className="kv-top-consumers-card__header"
        >
          <CardTitle>{t('kubevirt-plugin~Top consumers')} </CardTitle>
        </CardHeader>
        <CardBody className="kv-top-consumers-card__body">
          <TopConsumersGridRow
            topGrid
            numItemsToShow={numItemsOptionSelected}
            initialMetrics={initialMetrics.slice(0, 3)}
          />
          <TopConsumersGridRow
            numItemsToShow={numItemsOptionSelected}
            initialMetrics={initialMetrics.slice(3)}
          />
        </CardBody>
      </Card>
    </div>
  );
};
