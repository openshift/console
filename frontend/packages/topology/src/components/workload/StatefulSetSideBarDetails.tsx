import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { ResourceSummary } from '@console/internal/components/utils';
import { StatefulSetModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { getResource } from '../../utils';

type StatefulSetSideBarDetailsProps = {
  ss: K8sResourceKind;
};

const StatefulSetSideBarDetails: React.FC<StatefulSetSideBarDetailsProps> = ({ ss }) => (
  <div className="overview__sidebar-pane-body resource-overview__body">
    <div className="resource-overview__pod-counts">
      <PodRingSet key={ss.metadata.uid} obj={ss} path="/spec/replicas" />
    </div>
    <ResourceSummary resource={ss} showPodSelector showNodeSelector showTolerations />
  </div>
);

export const getStatefulSetSideBarDetails = (element: GraphElement) => {
  const resource = getResource(element);
  if (!resource || resource.kind !== StatefulSetModel.kind) return undefined;
  return <StatefulSetSideBarDetails ss={resource} />;
};
