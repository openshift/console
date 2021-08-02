import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';

import {
  monitoringDashboardsSetEndTime,
  monitoringDashboardsSetTimespan,
} from '../../../actions/ui';
import { RootState } from '../../../redux';
import { FormatSeriesTitle, QueryBrowser } from '../query-browser';

type Props = {
  formatSeriesTitle?: FormatSeriesTitle;
  isStack: boolean;
  pollInterval: number;
  queries: string[];
  showLegend?: boolean;
  units: string;
  onZoomHandle?: (timeRange: number, endTime: number) => void;
};

const Graph: React.FC<Props> = ({
  formatSeriesTitle,
  isStack,
  pollInterval,
  queries,
  showLegend,
  units,
  onZoomHandle,
}) => {
  const dispatch = useDispatch();
  const endTime = useSelector(({ UI }: RootState) => UI.getIn(['monitoringDashboards', 'endTime']));
  const timespan = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'timespan']),
  );

  const onZoom = React.useCallback(
    (from, to) => {
      dispatch(monitoringDashboardsSetEndTime(to));
      dispatch(monitoringDashboardsSetTimespan(to - from));
      onZoomHandle?.(to - from, to);
    },
    [dispatch, onZoomHandle],
  );

  return (
    <QueryBrowser
      defaultSamples={30}
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
    />
  );
};

export default Graph;
