import React from 'react';
import { Link } from 'react-router';

import { RulesList } from './rules';
import { DetailsPage } from '../factory';
import { Heading, navFactory, Timestamp } from '../utils';

const addHref = (name, ns) => ns ? `ns/${ns}/roles/${name}/add-rule` : `clusterroles/${name}/add-rule`;

const AddRule = (kind, role) => ({
  label: 'Add Rule',
  weight: 100,
  href: addHref(role.metadata.name, role.metadata.namespace),
});

const menuActions = [AddRule];

const Details = ({metadata, rules}) => <div>
  <Heading text="Role Overview" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-xs-6">
        <dl>
          <dt>Role Name</dt>
          <dd>{metadata.name}</dd>
        </dl>
      </div>
      <div className="col-xs-6">
        <dl>
          <dt>Created At</dt>
          <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
        </dl>
      </div>
    </div>
  </div>
  <Heading text="Rules" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-xs-12">
        <Link to={addHref(metadata.name, metadata.namespace)}>
          <button className="btn btn-primary">Add Rule</button>
        </Link>
        <RulesList rules={rules} metadata={metadata} />
      </div>
    </div>
  </div>
</div>;

const pages = [navFactory.details(Details)];

export const RolesDetailsPage = props => <DetailsPage {...props} pages={pages} menuActions={menuActions} />;
export const ClusterRolesDetailsPage = RolesDetailsPage;
