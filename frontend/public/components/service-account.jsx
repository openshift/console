import React from 'react';
import moment from 'moment';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, navFactory, ResourceCog, ResourceLink, Timestamp } from './utils';
import { SecretsList, withSecretsList } from './secret';

const menuActions = [Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="secrets">Secrets</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.creationTimestamp">Age</ColHead>
</ListHeader>;

const ServiceAccountRow = ({obj: serviceaccount}) => {
  const {metadata: {name, namespace, uid, creationTimestamp}, secrets} = serviceaccount;

  return (
    <ResourceRow obj={serviceaccount}>
      <div className="col-xs-4">
        <ResourceCog actions={menuActions} kind="serviceaccount" resource={serviceaccount} />
        <ResourceLink kind="serviceaccount" name={name} namespace={namespace} title={uid} />
      </div>
      <div className="col-xs-4">
        {secrets ? secrets.length : 0}
      </div>
      <div className="col-xs-4">
        {moment(creationTimestamp).fromNow()}
      </div>
    </ResourceRow>
  );
};

const Details = (serviceaccount) => {
  const {metadata: {namespace, creationTimestamp}, secrets} = serviceaccount;
  const filters = {selector: {field: 'metadata.name', values: new Set(_.map(secrets, 'name'))}};

  return (
    <div>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-6">
            <div className="co-m-pane__body-group">
              <dl>
                <dt>Created At</dt>
                <dd><Timestamp timestamp={creationTimestamp} /></dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-xs-12">
            <h1 className="co-section-title">Secrets</h1>
          </div>
        </div>
        <SecretsList namespace={namespace} filters={filters} />
      </div>
    </div>
  );
};

const ServiceAccountsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details)]}
/>;
const ServiceAccountsList = props => <List {...props} Header={Header} Row={withSecretsList(ServiceAccountRow)} />;
const ServiceAccountsPage = props => <ListPage ListComponent={ServiceAccountsList} {...props} />;
export {ServiceAccountsList, ServiceAccountsPage, ServiceAccountsDetailsPage};
