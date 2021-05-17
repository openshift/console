import * as React from 'react';
import { ChartLabel } from '@patternfly/react-charts';
import { AngleDoubleDownIcon, AngleDoubleUpIcon, EqualsIcon } from '@patternfly/react-icons';

import { global_palette_blue_50 as blue50 } from '@patternfly/react-tokens/dist/js/global_palette_blue_50';
import { global_palette_blue_300 as blue300 } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_gold_400 as gold400 } from '@patternfly/react-tokens/dist/js/global_palette_gold_400';
import { global_palette_orange_300 as orange300 } from '@patternfly/react-tokens/dist/js/global_palette_orange_300';
import { global_palette_red_200 as red200 } from '@patternfly/react-tokens/dist/js/global_palette_red_200';

import CriticalIcon from '../CriticalIcon';
import { ExternalLink } from '@console/internal/components/utils';

const chartColorScale = [blue50.value, gold400.value, orange300.value, red200.value];

const legendColorScale = {
  low: blue300.value,
  moderate: gold400.value,
  important: orange300.value,
  critical: red200.value,
};

const riskIcons = {
  low: AngleDoubleDownIcon,
  moderate: EqualsIcon,
  important: AngleDoubleUpIcon,
  critical: CriticalIcon,
};

const riskLabels = {
  // t('insights-plugin~Critical')
  critical: 'insights-plugin~Critical',
  // t('insights-plugin~Important')
  important: 'insights-plugin~Important',
  // t('insights-plugin~Moderate')
  moderate: 'insights-plugin~Moderate',
  // t('insights-plugin~Low')
  low: 'insights-plugin~Low',
};

const AdvisorChartTitle = (props) => {
  const { clusterId } = props;

  return clusterId ? (
    <ExternalLink href={`https://cloud.redhat.com/openshift/details/${clusterId}#insights`}>
      <ChartLabel
        {...props}
        style={[{ fontSize: 13 }]}
        className="insights-advisor--enabled-link"
      />
    </ExternalLink>
  ) : (
    <ChartLabel {...props} style={[{ fontSize: 13 }]} />
  );
};

const AdvisorChartLegendIcon = ({ x, y, datum }) => {
  const Icon = riskIcons[datum.id];
  return <Icon x={x - 3} y={y - 6} fill={legendColorScale[datum.id]} />;
};

export { chartColorScale, riskLabels, AdvisorChartTitle, AdvisorChartLegendIcon };
