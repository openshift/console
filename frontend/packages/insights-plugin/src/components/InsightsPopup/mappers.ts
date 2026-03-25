import { AngleDoubleDownIcon } from '@patternfly/react-icons/dist/esm/icons/angle-double-down-icon';
import { AngleDoubleUpIcon } from '@patternfly/react-icons/dist/esm/icons/angle-double-up-icon';
import { CriticalRiskIcon } from '@patternfly/react-icons/dist/esm/icons/critical-risk-icon';
import { EqualsIcon } from '@patternfly/react-icons/dist/esm/icons/equals-icon';
import {
  t_color_blue_10 as blue50,
  t_color_blue_50 as blue300,
  t_color_yellow_40 as gold400,
  t_color_orange_40 as orange300,
  t_color_red_60 as red200,
} from '@patternfly/react-tokens';
import * as _ from 'lodash';
import type { PrometheusResponse } from '@console/internal/components/graphs';

export const riskIcons = {
  low: AngleDoubleDownIcon,
  moderate: EqualsIcon,
  important: AngleDoubleUpIcon,
  critical: CriticalRiskIcon,
};

export const colorScale = [red200.value, orange300.value, gold400.value, blue50.value];

export const legendColorScale = {
  low: blue300.value,
  moderate: gold400.value,
  important: orange300.value,
  critical: red200.value,
};

export const riskSorting = {
  low: 0,
  moderate: 1,
  important: 2,
  critical: 3,
};

type Metrics = {
  critical?: number;
  important?: number;
  low?: number;
  moderate?: number;
};

type Conditions = {
  Available?: number;
  Degraded?: number;
  Disabled?: number;
  Progressing?: number;
  UploadDegraded?: number;
};

export const mapMetrics = (response: PrometheusResponse): Metrics => {
  const values: Metrics = {};
  for (let i = 0; i < response?.data.result.length; i++) {
    const value = response.data?.result?.[i]?.value?.[1];
    if (_.isNil(value)) {
      return null;
    }
    const metricName = response.data?.result?.[i]?.metric?.metric;
    if (values[metricName] === -1 || values[metricName] === undefined) {
      values[metricName] = parseInt(value, 10);
    }
  }

  return values;
};

export const mapConditions = (response: PrometheusResponse): Conditions =>
  response?.data?.result && Array.isArray(response.data.result)
    ? response.data.result.reduce((prev, cur) => {
        if (cur?.metric?.condition && cur?.value?.[1]) {
          prev[cur.metric.condition] = parseInt(cur.value[1], 10);
        }
        return prev;
      }, {})
    : {};

// An error occurred while requesting Insights results (e.g. IO is turned off)
export const isError = (values: Metrics) => _.isEmpty(values);

// Insights Operator has been just initialized and waiting for the first results
export const isWaiting = (values: Metrics) =>
  Object.values(values).some((cur: number) => cur === -1);

export const errorUpload = (conditions: Conditions) =>
  !!conditions.Degraded && !!conditions.UploadDegraded;
