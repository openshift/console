import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, SectionHeading, navFactory, ResourceCog, ResourceLink, ResourceSummary } from './utils';

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-md-5 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-7 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
</ListHeader>;

const kind = 'ResourceQuota';
const Row = ({obj: rq}) => <div className="row co-resource-list__item">
  <div className="col-md-5 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind={kind} resource={rq} />
    <ResourceLink kind={kind} name={rq.metadata.name} namespace={rq.metadata.namespace} title={rq.metadata.name} />
  </div>
  <div className="col-md-7 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={rq.metadata.namespace} title={rq.metadata.namespace} />
  </div>
</div>;

const Details = ({obj: rq}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Resource Quota Overview" />
    <ResourceSummary resource={rq} podSelector="spec.podSelector" showNodeSelector={false} />
  </div>
</React.Fragment>;

export const ResourceQuotasList = props => <List {...props} Header={Header} Row={Row} />;
export const ResourceQuotasPage = props => <ListPage {...props} ListComponent={ResourceQuotasList} kind={kind} canCreate={true} />;

export const ResourceQuotasDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
