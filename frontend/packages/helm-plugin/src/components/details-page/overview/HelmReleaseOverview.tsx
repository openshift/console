import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceSummary } from '@console/internal/components/utils/details-page';
import { SectionHeading } from '@console/internal/components/utils/headings';
import { K8sResourceKind } from '@console/internal/module/k8s/types';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { HelmRelease } from '../../../types/helm-types';
import HelmChartSummary from './HelmChartSummary';

export interface HelmReleaseOverviewProps {
  obj: K8sResourceKind;
  customData: HelmRelease;
}

const HelmReleaseOverview: React.FC<HelmReleaseOverviewProps> = ({ obj, customData }) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('helm-plugin~Helm Release details')} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={obj} customPathName={'metadata.labels.name'} />
        </div>
        <div className="col-sm-6">
          <HelmChartSummary helmRelease={customData} obj={obj} />
        </div>
      </div>
    </PaneBody>
  );
};

export default HelmReleaseOverview;
