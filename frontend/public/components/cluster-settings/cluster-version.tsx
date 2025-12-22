import type { FC } from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom-v5-compat';
import { useCanClusterUpgrade } from '@console/shared/src/hooks/useCanClusterUpgrade';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

import { ClusterVersionModel } from '../../models';
import { DetailsPage } from '../factory';
import { Conditions } from '../conditions';
import { ClusterVersionKind, K8sResourceKindReference, referenceForModel } from '../../module/k8s';
import { editYamlComponent, navFactory, viewYamlComponent } from '../utils/horizontal-nav';
import { ResourceSummary, UpstreamConfigDetailsItem } from '../utils/details-page';
import { SectionHeading } from '../utils/headings';
import { breadcrumbsForGlobalConfig } from './global-config';

const clusterVersionReference: K8sResourceKindReference = referenceForModel(ClusterVersionModel);

const ClusterVersionDetails: FC<ClusterVersionDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const canUpgrade = useCanClusterUpgrade();
  const conditions = _.get(obj, 'status.conditions', []);
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~ClusterVersion details')} />
        <ResourceSummary resource={obj} canUpdateResource={canUpgrade}>
          <UpstreamConfigDetailsItem resource={obj} />
        </ResourceSummary>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} id="conditions" />
        <Conditions conditions={conditions} />
      </PaneBody>
    </>
  );
};

export const ClusterVersionDetailsPage: FC = (props) => {
  const canUpgrade = useCanClusterUpgrade();
  const location = useLocation();
  return (
    <DetailsPage
      {...props}
      kind={clusterVersionReference}
      pages={[
        navFactory.details(ClusterVersionDetails),
        navFactory.editYaml(canUpgrade ? editYamlComponent : viewYamlComponent),
      ]}
      breadcrumbsFor={() =>
        breadcrumbsForGlobalConfig(ClusterVersionModel.label, location.pathname)
      }
    />
  );
};

type ClusterVersionDetailsProps = {
  obj: ClusterVersionKind;
};
