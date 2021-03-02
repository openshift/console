import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';

import {
  monitoringDashboardsSetEndTime,
  monitoringDashboardsSetTimespan,
} from '../../../actions/ui';
import { RootState } from '../../../redux';
import { FormatLegendLabel, QueryBrowser } from '../query-browser';

type Props = {
  formatLegendLabel?: FormatLegendLabel;
  isStack: boolean;
  pollInterval: number;
  queries: string[];
};

const Graph: React.FC<Props> = ({ formatLegendLabel, isStack, pollInterval, queries }) => {
  const dispatch = useDispatch();
  const endTime = useSelector(({ UI }: RootState) => UI.getIn(['monitoringDashboards', 'endTime']));
  const timespan = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'timespan']),
  );

  const onZoom = React.useCallback(
    (from, to) => {
      dispatch(monitoringDashboardsSetEndTime(to));
      dispatch(monitoringDashboardsSetTimespan(to - from));
    },
    [dispatch],
  );

  return (
    <QueryBrowser
      defaultSamples={30}
      fixedEndTime={endTime}
      formatLegendLabel={formatLegendLabel}
      hideControls
      isStack={isStack}
      onZoom={onZoom}
      pollInterval={pollInterval}
      queries={queries}
      timespan={timespan}
    />
  );
};

export default Graph;
