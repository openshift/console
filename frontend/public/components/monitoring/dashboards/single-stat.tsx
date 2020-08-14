import * as _ from 'lodash-es';
import * as React from 'react';
import { Bullseye } from '@patternfly/react-core';

import ErrorAlert from '@console/shared/src/components/alerts/error';

import { formatNumber } from './format';
import { Panel } from './types';
import { PrometheusResponse } from '../../graphs';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import { LoadingInline, usePoll, useSafeFetch } from '../../utils';

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Bullseye className="monitoring-dashboards__single-stat query-browser__wrapper">
    {children}
  </Bullseye>
);

const SingleStat: React.FC<Props> = ({ panel, pollInterval, query }) => {
  const {
    decimals,
    format,
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

  return (
    <Body>
      {prefix && <span style={{ fontSize: prefixFontSize }}>{prefix}</span>}
      <span style={{ fontSize: valueFontSize }}>
        {valueMap ? valueMap.text : formatNumber(value, decimals, format)}
      </span>
      {postfix && <span style={{ fontSize: postfixFontSize }}>{postfix}</span>}
    </Body>
  );
};

type Props = {
  panel: Panel;
  pollInterval: number;
  query: string;
};

export default SingleStat;
