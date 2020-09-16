import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import { ClusterVersionModel } from '../../models';
import { DetailsPage } from '../factory';
import { Conditions } from '../conditions';
import { ClusterVersionKind, K8sResourceKindReference, referenceForModel } from '../../module/k8s';
import { navFactory, ResourceSummary, SectionHeading } from '../utils';

const clusterVersionReference: K8sResourceKindReference = referenceForModel(ClusterVersionModel);

const ClusterVersionDetails: React.FC<ClusterVersionDetailsProps> = ({ obj }) => {
  const conditions = _.get(obj, 'status.conditions', []);
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading
          text={t('cluster-version~{{resource}} details', { resource: ClusterVersionModel.label })}
        />
        <ResourceSummary resource={obj} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('cluster-version~Conditions')} id="conditions" />
        <Conditions conditions={conditions} />
      </div>
    </>
  );
};

export const ClusterVersionDetailsPage: React.FC<ClusterVersionDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={clusterVersionReference}
    pages={[navFactory.details(ClusterVersionDetails), navFactory.editYaml()]}
  />
);

type ClusterVersionDetailsProps = {
  obj: ClusterVersionKind;
};

type ClusterVersionDetailsPageProps = {
  match: any;
};
