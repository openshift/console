import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { SectionHeading, detailsPage, navFactory, ResourceLink, ResourceSummary } from './utils';
import { viewYamlComponent } from './utils/vertnav';
import * as classNames from 'classnames';
// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import * as _ from 'lodash-es';

const ClusterServiceClassReference: K8sResourceKindReference = 'ClusterServiceClass';

const normalizeIconClass = (iconClass) => {
  return _.startsWith(iconClass, 'icon-') ? `font-icon ${iconClass}` : iconClass;
};

export const ClusterServiceClassIcon: React.SFC<ClusterServiceClassIconProps> = ({serviceClass, imageClass}) => {
  const iconClass = _.get(serviceClass, ['spec', 'externalMetadata', 'console.openshift.io/iconClass']);
  const imageUrl = _.get(serviceClass, ['spec', 'externalMetadata', 'imageUrl']);

  if (iconClass) {
    return <span className={classNames('fa-3x', 'co-cluster-service-class-title__icon', normalizeIconClass(iconClass))} />;
  }
  if (imageUrl) {
    return <img className={classNames('co-cluster-service-class-title__icon', imageClass ? imageClass : null)} src={imageUrl} />;
  }

  return null;
};
ClusterServiceClassIcon.displayName = 'ClusterServiceClassIcon';

const ClusterServiceClassHeader: React.SFC<ClusterServiceClassHeaderProps> = props => <ListHeader>
  <ColHead {...props} className="col-lg-4 col-md-4 col-sm-6 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-5 col-md-5 col-sm-6 col-xs-6" sortField="spec.externalMetadata.displayName">Display Name</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-3 hidden-sm hidden-xs" sortField="spec.externalName">External Name</ColHead>
</ListHeader>;

const ClusterServiceClassListRow: React.SFC<ClusterServiceClassRowProps> = ({obj: serviceClass}) => <ResourceRow obj={serviceClass}>
  <div className="col-lg-4 col-md-4 col-sm-6 col-xs-6 co-resource-link-wrapper">
    <ResourceLink kind="ClusterServiceClass" name={serviceClass.metadata.name} />
  </div>
  <div className="col-lg-5 col-md-5 col-sm-6 col-xs-6">
    <ClusterServiceClassIcon serviceClass={serviceClass} imageClass="co-cluster-service-class-row__img" />
    {_.get(serviceClass, 'spec.externalMetadata.displayName')}
  </div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">{serviceClass.spec.externalName}</div>
</ResourceRow>;

const ClusterServiceClassDetails: React.SFC<ClusterServiceClassDetailsProps> = ({obj: serviceClass}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Service Class Overview" />
    <div className="row">
      <div className="col-sm-6">
        <ResourceSummary resource={serviceClass} showPodSelector={false} showNodeSelector={false}>
          <dt>Display Name</dt>
          <dd>{_.get(serviceClass, 'spec.externalMetadata.displayName', '-')}</dd>
          <dt>External Name</dt>
          <dd>{_.get(serviceClass, 'spec.externalName', '-')}</dd>
          <dt>Provider</dt>
          <dd>{_.get(serviceClass, 'spec.externalMetadata.providerDisplayName', '-')}</dd>
          {!_.isEmpty('serviceClass.spec.tags') && <React.Fragment>
            <dt>Tags</dt>
            <dd>{_.join(_.get(serviceClass, 'spec.tags'), ', ')}</dd>
          </React.Fragment>
          }
        </ResourceSummary>
      </div>
      <div className="col-sm-6 ">
        <h2>
          <ClusterServiceClassIcon serviceClass={serviceClass} imageClass="co-cluster-service-class-details__img" />
          <span>
            {_.get(serviceClass, 'spec.externalMetadata.displayName',
              _.get(serviceClass, 'spec.externalName', ''))}
          </span>
        </h2>
        <dd>{_.get(serviceClass, ['spec', 'description'])}</dd>
        <dd>{_.get(serviceClass, ['spec', 'externalMetadata', 'longDescription'])}</dd>
        {_.has(serviceClass, ['spec', 'externalMetadata', 'documentationUrl']) && <React.Fragment>
          <dt>Documentation</dt>
          <dd>
            <a href={serviceClass.spec.externalMetadata.documentationUrl} target="_blank"
              rel="noopener noreferrer">{serviceClass.spec.externalMetadata.documentationUrl}</a>
          </dd>
        </React.Fragment>}
        {_.has(serviceClass, ['spec', 'externalMetadata', 'supportUrl']) && <React.Fragment>
          <dt>Support</dt>
          <dd>
            <a href={serviceClass.spec.externalMetadata.supportUrl} target="_blank"
              rel="noopener noreferrer">{serviceClass.spec.externalMetadata.supportUrl}</a>
          </dd>
        </React.Fragment>}
      </div>
    </div>
  </div>
</React.Fragment>;

export const ClusterServiceClassDetailsPage: React.SFC<ClusterServiceClassDetailsPageProps> = props => <DetailsPage
  {...props}
  kind={ClusterServiceClassReference}
  pages={[navFactory.details(detailsPage(ClusterServiceClassDetails)), navFactory.editYaml(viewYamlComponent)]}
/>;
export const ClusterServiceClassList: React.SFC = props => <List {...props} Header={ClusterServiceClassHeader} Row={ClusterServiceClassListRow} />;

export const ClusterServiceClassPage: React.SFC<ClusterServiceClassPageProps> = props =>
  <ListPage
    ListComponent={ClusterServiceClassList}
    kind={ClusterServiceClassReference}
    canCreate={false}
    {...props}
  />;

/* eslint-disable no-undef */
export type ClusterServiceClassRowProps = {
  obj: K8sResourceKind
};

export type ClusterServiceClassHeaderProps = {
  obj: K8sResourceKind
};

export type ClusterServiceClassPageProps = {
  obj: K8sResourceKind
};

export type ClusterServiceClassDetailsProps = {
  obj: K8sResourceKind
};

export type ClusterServiceClassDetailsPageProps = {
  match: any
};

export type ClusterServiceClassIconProps = {
  serviceClass: K8sResourceKind,
  imageClass?: string
};
/* eslint-enable no-undef */
