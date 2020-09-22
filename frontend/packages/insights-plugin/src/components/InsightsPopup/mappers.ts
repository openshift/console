import * as _ from 'lodash';

import { global_palette_blue_50 as blue50 } from '@patternfly/react-tokens/dist/js/global_palette_blue_50';
import { global_palette_blue_300 as blue300 } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_gold_400 as gold400 } from '@patternfly/react-tokens/dist/js/global_palette_gold_400';
import { global_palette_orange_300 as orange300 } from '@patternfly/react-tokens/dist/js/global_palette_orange_300';
import { global_palette_red_200 as red200 } from '@patternfly/react-tokens/dist/js/global_palette_red_200';

import { AngleDoubleDownIcon, AngleDoubleUpIcon, EqualsIcon } from '@patternfly/react-icons';
import CriticalIcon from './CriticalIcon';
import { PrometheusResponse } from '@console/internal/components/graphs';

export const riskIcons = {
  low: AngleDoubleDownIcon,
  moderate: EqualsIcon,
  important: AngleDoubleUpIcon,
  critical: CriticalIcon,
};

export const colorScale = [blue50.value, gold400.value, orange300.value, red200.value];

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

export const mapMetrics = (response: PrometheusResponse): Metrics => {
  const values: Metrics = {};
  for (let i = 0; i < response.data.result.length; i++) {
    const value = response.data?.result?.[i]?.value?.[1];
    if (_.isNil(value)) {
      return null;
    }
    const metricName = response.data?.result?.[i]?.metric?.metric;
    values[metricName] = parseInt(value, 10);
  }

  return values;
};
