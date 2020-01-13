import * as React from 'react';
import { ResourceSummary, SectionHeading } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';

export interface HelmReleaseOverviewProps {
  obj: K8sResourceKind;
}

const HelmReleaseOverview: React.FC<HelmReleaseOverviewProps> = ({ obj: resourceDetails }) => {
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Helm Release Overview" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={resourceDetails} customPathName={'metadata.labels.name'} />
        </div>
      </div>
    </div>
  );
};

export default HelmReleaseOverview;
