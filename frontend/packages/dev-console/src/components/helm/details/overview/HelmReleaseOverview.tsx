import * as React from 'react';
import { ResourceSummary, SectionHeading } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { HelmRelease } from '../../helm-types';
import HelmChartSummary from './HelmChartSummary';

export interface HelmReleaseOverviewProps {
  obj: K8sResourceKind;
  customData: HelmRelease;
}

const HelmReleaseOverview: React.FC<HelmReleaseOverviewProps> = ({
  obj: resourceDetails,
  customData,
}) => {
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Helm Release Details" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={resourceDetails} customPathName={'metadata.labels.name'} />
        </div>
        <div className="col-sm-6">
          <HelmChartSummary helmRelease={customData} />
        </div>
      </div>
    </div>
  );
};

export default HelmReleaseOverview;
