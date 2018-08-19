/* eslint-disable no-undef */

import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { SectionHeading, detailsPage, navFactory, ResourceLink, ResourceSummary } from './utils';
import { viewYamlComponent } from './utils/vertnav';
import * as classNames from 'classnames';
// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, K8sResourceKindReference, serviceClassDisplayName } from '../module/k8s';
import * as _ from 'lodash-es';

const ClusterServiceClassReference: K8sResourceKindReference = 'ClusterServiceClass';

const normalizeIconClass = (iconClass) => {
  return _.startsWith(iconClass, 'icon-') ? `font-icon ${iconClass}` : iconClass;
};

export const ClusterServiceClassIcon: React.SFC<ClusterServiceClassIconProps> = ({serviceClass, imageClass}) => {
  const imageUrl = _.get(serviceClass, ['spec', 'externalMetadata', 'imageUrl']);
  if (imageUrl) {
    return <img className={classNames('co-cluster-service-class-title__icon', imageClass ? imageClass : null)} src={imageUrl} />;
  }

  const iconClass = _.get(serviceClass, ['spec', 'externalMetadata', 'console.openshift.io/iconClass'], 'fa fa-clone');
  return <span className={classNames('fa-2x', 'co-cluster-service-class-title__icon', normalizeIconClass(iconClass))} />;
};
ClusterServiceClassIcon.displayName = 'ClusterServiceClassIcon';

const ClusterServiceClassHeader: React.SFC<ClusterServiceClassHeaderProps> = props => <ListHeader>
  <ColHead {...props} className="col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-6" sortFunc="serviceClassDisplayName">Display Name</ColHead>
</ListHeader>;

const ClusterServiceClassListRow: React.SFC<ClusterServiceClassRowProps> = ({obj: serviceClass}) => <ResourceRow obj={serviceClass}>
  <div className="col-xs-6 co-resource-link-wrapper">
    <ResourceLink kind="ClusterServiceClass" name={serviceClass.metadata.name} />
  </div>
  <div className="col-xs-6">
    <ClusterServiceClassIcon serviceClass={serviceClass} imageClass="co-cluster-service-class-row__img" />
    {serviceClassDisplayName(serviceClass)}
  </div>
</ResourceRow>;

const ClusterServiceClassDetails: React.SFC<ClusterServiceClassDetailsProps> = ({obj: serviceClass}) => {
  const displayName = _.get(serviceClass, 'spec.externalMetadata.displayName', '-');
  const provider = _.get(serviceClass, 'spec.externalMetadata.providerDisplayName', '-');
  const tags = _.get(serviceClass, 'spec.tags');
  const description = _.get(serviceClass, 'spec.description');
  const longDescription = _.get(serviceClass, 'spec.externalMetadata.longDescription');
  const documentationURL = _.get(serviceClass, 'spec.externalMetadata.documentationUrl');
  const supportURL = _.get(serviceClass, 'spec.externalMetadata.supportUrl');
  const heading = <span>
    <ClusterServiceClassIcon serviceClass={serviceClass} imageClass="co-cluster-service-class-details__img" />
    {serviceClassDisplayName(serviceClass)}
  </span>;
  return <div className="co-m-pane__body">
    <div className="row">
      <div className="col-md-7 col-md-push-5" style={{marginBottom: '20px'}}>
        <h2 className="co-section-heading">{heading}</h2>
        {description && <p>{description}</p>}
        {longDescription && <p>{longDescription}</p>}
        {(documentationURL || supportURL) && <dl>
          {documentationURL && <dt>Documentation</dt>}
          {documentationURL && <dd className="co-break-word">
            <a href={serviceClass.spec.externalMetadata.documentationUrl} target="_blank" rel="noopener noreferrer">{serviceClass.spec.externalMetadata.documentationUrl}</a>
          </dd>}
          {supportURL && <dt>Support</dt>}
          {supportURL && <dd className="co-break-word">
            <a href={serviceClass.spec.externalMetadata.supportUrl} target="_blank" rel="noopener noreferrer">{serviceClass.spec.externalMetadata.supportUrl}</a>
          </dd>}
        </dl>}
      </div>
      <div className="col-md-5 col-md-pull-7">
        <SectionHeading text="Service Class Overview" />
        <ResourceSummary resource={serviceClass} showPodSelector={false} showNodeSelector={false}>
          <dt>Display Name</dt>
          <dd>{displayName}</dd>
          <dt>External Name</dt>
          <dd>{serviceClass.spec.externalName || '-'}</dd>
          <dt>Provider</dt>
          <dd>{provider}</dd>
          <dt>Tags</dt>
          <dd>{_.isEmpty(tags) ? '-' : tags.join(', ')}</dd>
        </ResourceSummary>
      </div>
    </div>
  </div>;
};

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
    filterLabel="Service Classes by display name"
    textFilter="service-class"
    canCreate={false}
    {...props}
  />;

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
