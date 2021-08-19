import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { PodDetailsList, PodResourceSummary } from '@console/internal/components/pod';
import { PodModel } from '@console/internal/models';
import { PodKind } from '@console/internal/module/k8s';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { getResource } from '../../utils';

type PodSideBarDetailsProps = {
  pod: PodKind;
};

const PodSideBarDetails: React.FC<PodSideBarDetailsProps> = ({ pod }) => {
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <PodRingSet key={pod.metadata.uid} obj={pod} path="" />
      </div>
      <div className="resource-overview__summary">
        <PodResourceSummary pod={pod} />
      </div>
      <div className="resource-overview__details">
        <PodDetailsList pod={pod} />
      </div>
    </div>
  );
};

export const getPodSideBarDetails = (element: GraphElement) => {
  const resource = getResource<PodKind>(element);
  if (resource.kind !== PodModel.kind) return undefined;
  return <PodSideBarDetails pod={resource} />;
};
