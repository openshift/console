import type { FC } from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceSummary } from '@console/internal/components/utils/details-page';
import { SectionHeading } from '@console/internal/components/utils/headings';
import type { K8sResourceKind } from '@console/internal/module/k8s/types';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import type { HelmRelease } from '../../../types/helm-types';
import HelmChartSummary from './HelmChartSummary';

export interface HelmReleaseOverviewProps {
  obj: K8sResourceKind;
  customData: HelmRelease;
}

const HelmReleaseOverview: FC<HelmReleaseOverviewProps> = ({ obj, customData }) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('helm-plugin~Helm Release details')} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={obj} customPathName={'metadata.labels.name'} />
        </GridItem>
        <GridItem sm={6}>
          <HelmChartSummary helmRelease={customData} obj={obj} />
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export default HelmReleaseOverview;
