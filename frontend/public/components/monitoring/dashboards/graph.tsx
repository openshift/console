import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';

import { FormatSeriesTitle } from '@console/dynamic-plugin-sdk';
import { QueryBrowser } from '@console/shared/src/components/query-browser';

import { dashboardsSetEndTime, dashboardsSetTimespan } from '../../../actions/observe';
import { RootState } from '../../../redux';
import { DEFAULT_GRAPH_SAMPLES, getActivePerspective } from './monitoring-dashboard-utils';

import { CustomDataSource } from '@console/dynamic-plugin-sdk/src/extensions/dashboard-data-source';

type Props = {
  formatSeriesTitle?: FormatSeriesTitle;
  isStack: boolean;
  pollInterval: number;
  queries: string[];
  showLegend?: boolean;
  units: string;
  onZoomHandle?: (timeRange: number, endTime: number) => void;
  namespace?: string;
  customDataSource?: CustomDataSource;
};

const Graph: React.FC<Props> = ({
  formatSeriesTitle,
  isStack,
  pollInterval,
  queries,
  showLegend,
  units,
  onZoomHandle,
  namespace,
  customDataSource,
}) => {
  const dispatch = useDispatch();
  const activePerspective = getActivePerspective(namespace);
  const endTime = useSelector(({ observe }: RootState) =>
    observe.getIn(['dashboards', activePerspective, 'endTime']),
  );
  const timespan = useSelector(({ observe }: RootState) =>
    observe.getIn(['dashboards', activePerspective, 'timespan']),
  );

  const onZoom = React.useCallback(
    (from, to) => {
      dispatch(dashboardsSetEndTime(to, activePerspective));
      dispatch(dashboardsSetTimespan(to - from, activePerspective));
      onZoomHandle?.(to - from, to);
    },
    [activePerspective, dispatch, onZoomHandle],
  );

  return (
    <QueryBrowser
      defaultSamples={DEFAULT_GRAPH_SAMPLES}
      fixedEndTime={endTime}
      formatSeriesTitle={formatSeriesTitle}
      hideControls
      isStack={isStack}
      onZoom={onZoom}
      pollInterval={pollInterval}
      queries={queries}
      showLegend={showLegend}
      timespan={timespan}
      units={units}
      namespace={namespace}
      customDataSource={customDataSource}
    />
  );
};

export default Graph;
