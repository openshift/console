import * as React from 'react';
import {
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardTitle,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TopConsumerMetric } from '../../../constants/virt-overview/top-consumers-card/top-consumer-metric';
import { FormPFSelect } from '../../form/form-pf-select';
import { TopConsumersGridRow } from './TopConsumersGridRow';

import './top-consumers-card.scss';

const initialMetrics = [
  TopConsumerMetric.CPU,
  TopConsumerMetric.MEMORY,
  TopConsumerMetric.FILESYSTEM,
  TopConsumerMetric.MEMORY_SWAP,
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
      <Card data-test="kv-top-consumers-card">
        <CardHeader className="kv-top-consumers-card__header">
          <CardTitle>{t('kubevirt-plugin~Top consumers')} </CardTitle>
          <CardActions className="co-overview-card__actions">
            <Link to="/monitoring/dashboards/grafana-dashboard-kubevirt-top-consumers?period=4h">
              {t('kubevirt-plugin~View virtualization dashboard')}
            </Link>
            <div className="kv-top-consumers-card__dropdown">
              <FormPFSelect
                toggleId="kv-top-consumers-card-amount-select"
                variant={SelectVariant.single}
                selections={numItemsToShow}
                onSelect={(e, value) => onTopAmountSelect(value)}
              >
                {topAmountSelectOptions(t).map((opt) => (
                  <SelectOption key={opt.key} value={opt.value} />
                ))}
              </FormPFSelect>
            </div>
          </CardActions>
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
