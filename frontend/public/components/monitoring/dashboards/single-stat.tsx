import * as _ from 'lodash-es';
import * as React from 'react';
import { Bullseye } from '@patternfly/react-core';

import ErrorAlert from '@console/shared/src/components/alerts/error';

import { formatNumber } from '../format';
import { Panel } from './types';
import { PrometheusResponse } from '../../graphs';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import { LoadingInline, usePoll, useSafeFetch } from '../../utils';

const colorMap = {
  'super-light-blue': 'blue-100',
  'light-blue': 'blue-200',
  blue: 'blue-300',
  'semi-dark-blue': 'blue-400',
  'dark-blue': 'blue-500',

  'super-light-green': 'green-100',
  'light-green': 'green-200',
  green: 'green-300',
  'semi-dark-green': 'green-400',
  'dark-green': 'green-500',

  'super-light-orange': 'orange-100',
  'light-orange': 'orange-200',
  orange: 'orange-300',
  'semi-dark-orange': 'orange-400',
  'dark-orange': 'orange-500',

  'super-light-purple': 'purple-100',
  'light-purple': 'purple-200',
  purple: 'purple-300',
  'semi-dark-purple': 'purple-400',
  'dark-purple': 'purple-500',

  'super-light-red': 'red-100',
  'light-red': 'red-200',
  red: 'red-300',
  'semi-dark-red': 'red-400',
  'dark-red': 'red-500',

  'super-light-yellow': 'gold-100',
  'light-yellow': 'gold-200',
  yellow: 'gold-300',
  'semi-dark-yellow': 'gold-400',
  'dark-yellow': 'gold-500',
};

const getColorCSS = (colorName: string): string =>
  colorMap[colorName] ? `var(--pf-chart-color-${colorMap[colorName]})` : undefined;

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Bullseye className="monitoring-dashboards__single-stat query-browser__wrapper">
    {children}
  </Bullseye>
);

const SingleStat: React.FC<Props> = ({ panel, pollInterval, query }) => {
  const {
    decimals,
    format,
    options,
    postfix,
    postfixFontSize,
    prefix,
    prefixFontSize,
    valueFontSize,
    valueMaps,
  } = panel;

  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [value, setValue] = React.useState<string>();

  const safeFetch = React.useCallback(useSafeFetch(), []);

  const tick = () =>
    safeFetch(getPrometheusURL({ endpoint: PrometheusEndpoint.QUERY, query }))
      .then((response: PrometheusResponse) => {
        setError(undefined);
        setIsLoading(false);
        setValue(_.get(response, 'data.result[0].value[1]'));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(_.get(err, 'json.error', err.message));
          setIsLoading(false);
          setValue(undefined);
        }
      });

  usePoll(tick, pollInterval, query);

  const filteredVMs = valueMaps?.filter((vm) => vm.op === '=');
  const valueMap =
    value === undefined
      ? filteredVMs?.find((vm) => vm.value === 'null')
      : filteredVMs?.find((vm) => vm.value === value);

  if (isLoading) {
    return <LoadingInline />;
  }
  if (error) {
    return <ErrorAlert message={error} />;
  }

  let color;
  const thresholds = options?.fieldOptions?.thresholds;
  if (thresholds && value !== undefined) {
    const thresholdIndex =
      _.sortedIndexBy(thresholds, { value: Number(value) }, (t) => Number(t.value)) - 1;
    color = getColorCSS(thresholds[thresholdIndex]?.color);
  }

  return (
    <Body>
      {prefix && <span style={{ color, fontSize: prefixFontSize }}>{prefix}</span>}
      <span style={{ color, fontSize: valueFontSize }}>
        {valueMap ? valueMap.text : formatNumber(value, decimals, format)}
      </span>
      {postfix && <span style={{ color, fontSize: postfixFontSize }}>{postfix}</span>}
    </Body>
  );
};

type Props = {
  panel: Panel;
  pollInterval: number;
  query: string;
};

export default SingleStat;
