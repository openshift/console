import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom-v5-compat';
import { useCanClusterUpgrade } from '@console/shared';

import { ClusterVersionModel } from '../../models';
import { DetailsPage } from '../factory';
import { Conditions } from '../conditions';
import { ClusterVersionKind, K8sResourceKindReference, referenceForModel } from '../../module/k8s';
import {
  editYamlComponent,
  navFactory,
  ResourceSummary,
  SectionHeading,
  UpstreamConfigDetailsItem,
  viewYamlComponent,
} from '../utils';
import { breadcrumbsForGlobalConfig } from './global-config';

const clusterVersionReference: K8sResourceKindReference = referenceForModel(ClusterVersionModel);

const ClusterVersionDetails: React.FC<ClusterVersionDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const canUpgrade = useCanClusterUpgrade();
  const conditions = _.get(obj, 'status.conditions', []);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~ClusterVersion details')} />
        <ResourceSummary resource={obj} canUpdateResource={canUpgrade}>
          <UpstreamConfigDetailsItem resource={obj} />
        </ResourceSummary>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} id="conditions" />
        <Conditions conditions={conditions} />
      </div>
    </>
  );
};

export const ClusterVersionDetailsPage: React.FC = (props) => {
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
