import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import { ClusterVersionModel } from '../../models';
import { DetailsPage } from '../factory';
import { Conditions } from '../conditions';
import { ClusterVersionKind, K8sResourceKindReference, referenceForModel } from '../../module/k8s';
import {
  navFactory,
  ResourceSummary,
  SectionHeading,
  UpstreamConfigDetailsItem,
  editYamlComponent,
  viewYamlComponent,
} from '../utils';
import { breadcrumbsForGlobalConfig } from './global-config';
import { useCanClusterUpgrade } from '@console/shared/src/hooks/useCanClusterUpgrade';

const clusterVersionReference: K8sResourceKindReference = referenceForModel(ClusterVersionModel);

const ClusterVersionDetails: React.FC<ClusterVersionDetailsProps> = ({ obj }) => {
  const conditions = _.get(obj, 'status.conditions', []);
  const canUpgrade = useCanClusterUpgrade();
  const { t } = useTranslation();
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

export const ClusterVersionDetailsPage: React.FC<ClusterVersionDetailsPageProps> = (props) => {
  const canUpgrade = useCanClusterUpgrade();
  return (
    <DetailsPage
      {...props}
      kind={clusterVersionReference}
      pages={[
        navFactory.details(ClusterVersionDetails),
        navFactory.editYaml(canUpgrade ? editYamlComponent : viewYamlComponent),
      ]}
      breadcrumbsFor={() => breadcrumbsForGlobalConfig(ClusterVersionModel.label, props.match.url)}
    />
  );
};

type ClusterVersionDetailsProps = {
  obj: ClusterVersionKind;
};

type ClusterVersionDetailsPageProps = {
  match: any;
};
