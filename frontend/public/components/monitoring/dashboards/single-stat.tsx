import * as _ from 'lodash-es';
import * as React from 'react';
import { Bullseye } from '@patternfly/react-core';

import ErrorAlert from '@console/shared/src/components/alerts/error';

import { PrometheusResponse } from '../../graphs';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import { LoadingInline, usePoll, useSafeFetch } from '../../utils';

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Bullseye className="monitoring-dashboards__single-stat query-browser__wrapper">
    {children}
  </Bullseye>
);

const SingleStat: React.FC<Props> = ({
  decimals = 2,
  format = 'none',
  pollInterval,
  postfix = '',
  prefix = '',
  query,
  units = '',
}) => {
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

  if (isLoading) {
    return <LoadingInline />;
  }
  if (error) {
    return <ErrorAlert message={error} />;
  }
  if (value === undefined) {
    return (
      <Body>
        <span className="text-muted">-</span>
      </Body>
    );
  }

  const numberValue = Number(value);
  if (isNaN(numberValue)) {
    return <ErrorAlert message={`Could not parse value "${value}" as a number`} />;
  }

  return (
    <Body>
      {prefix}
      {(format === 'percentunit' ? 100 * numberValue : numberValue).toFixed(decimals)}
      {format === 'percentunit' ? '%' : units}
      {postfix}
    </Body>
  );
};

type Props = {
  decimals?: number;
  format?: string;
  pollInterval: number;
  postfix?: string;
  prefix?: string;
  query: string;
  units?: string;
};

export default SingleStat;
