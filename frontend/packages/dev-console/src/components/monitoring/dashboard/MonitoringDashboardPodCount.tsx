import * as React from 'react';
import { Bullseye } from '@patternfly/react-core';
import { Firehose, FirehoseResult, LoadingInline } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import './MonitoringDashboardPodCount.scss';
import { PodKind } from '@console/internal/module/k8s';

interface MonitoringDasboardPodCountProps {
  namespace: string;
}

interface PodCountProps {
  pods?: FirehoseResult<PodKind[]>;
}

export const PodCount: React.FC<PodCountProps> = ({ pods }) => {
  return (
    <div className="odc-monitoring-dashboard-pod-count">
      <h5>Pod Count</h5>
      <Bullseye>
        {pods.loaded ? (
          <h1 className="odc-monitoring-dashboard-pod-count__count">{pods.data.length}</h1>
        ) : (
          <LoadingInline />
        )}
      </Bullseye>
    </div>
  );
};

const MonitoringDasboardPodCount: React.FC<MonitoringDasboardPodCountProps> = ({ namespace }) => (
  <Firehose resources={[{ kind: PodModel.kind, prop: 'pods', isList: true, namespace }]}>
    <PodCount />
  </Firehose>
);

export default MonitoringDasboardPodCount;
