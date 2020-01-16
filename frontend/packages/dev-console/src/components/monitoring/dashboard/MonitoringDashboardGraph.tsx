import * as React from 'react';
import { QueryBrowser } from '@console/internal/components/monitoring/query-browser';
import { Humanize } from '@console/internal/components/utils';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { Area } from '@console/internal/components/graphs/area';
import './MonitoringDashboardGraph.scss';

export enum GraphTypes {
  area = 'Area',
  line = 'Line',
}

interface MonitoringDashboardGraphProps {
  title: string;
  query: string;
  namespace: string;
  graphType?: GraphTypes;
  humanize: Humanize;
  byteDataType: ByteDataTypes;
}

const defaultTimespan = 30 * 60 * 1000;

const MonitoringDashboardGraph: React.FC<MonitoringDashboardGraphProps> = ({
  query,
  namespace,
  title,
  graphType = GraphTypes.area,
  humanize,
  byteDataType,
}) => {
  return (
    <div className="odc-monitoring-dashboard-graph">
      {graphType === GraphTypes.line ? (
        <>
          <h5 className="graph-title">{title}</h5>
          <QueryBrowser
            hideControls
            defaultTimespan={defaultTimespan}
            namespace={namespace}
            queries={[query]}
          />
        </>
      ) : (
        <Area
          title={title}
          humanize={humanize}
          byteDataType={byteDataType}
          namespace={namespace}
          query={query}
        />
      )}
    </div>
  );
};

export default MonitoringDashboardGraph;
