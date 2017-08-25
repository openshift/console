import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.ResourceQuota', `apiVersion: v1
kind: ResourceQuota
metadata:
  name: example
spec:
  hard:
    pods: "4"
    requests.cpu: "1"
    requests.memory: 1Gi
    limits.cpu: "2"
    limits.memory: 2Gi
`);


const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.namespace">Namespace</ColHead>
</ListHeader>;

const kind = 'ResourceQuota';
const Row = ({obj: ss}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceCog actions={menuActions} kind={kind} resource={ss} />
    <ResourceLink kind={kind} name={ss.metadata.name} namespace={ss.metadata.namespace} title={ss.metadata.name} />
  </div>
  <div className="col-xs-3">
    <ResourceLink kind="Namespace" name={ss.metadata.namespace} title={ss.metadata.namespace} />
  </div>
</div>;

const Details = (ss) => <div>
  <Heading text="ResourceQuota Overview" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-sm-6 col-xs-12">
        <ResourceSummary resource={ss} podSelector="spec.podSelector" showNodeSelector={false} />
      </div>
    </div>
  </div>
</div>;

export const ResourceQuotasList = props => <List {...props} Header={Header} Row={Row} />;
export const ResourceQuotasPage = props => <ListPage {...props} ListComponent={ResourceQuotasList} kind={kind} canCreate={true} />;

export const ResourceQuotasDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
