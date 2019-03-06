import * as React from 'react';
import { getHostStatus } from 'kubevirt-web-ui-components';

import {
  ListHeader,
  ColHead,
  List,
  ListPage,
  ResourceRow,
} from '../factory/okdfactory';
import { BaremetalHostModel } from '../../models/host';
import { ResourceLink } from '../utils/okdutils';
import { NamespaceModel } from '../../models/index';

const mainColumnClasses = 'col-lg-2 col-md-4 col-sm-6 col-xs-6';
const statusColumnClasses = 'col-lg-2 col-md-4 hidden-sm hidden-xs';
const roleColumnClasses = 'col-lg-1 visible-lg';
const hideableColumnClasses = 'col-lg-2 visible-lg';

const HostHeader = props => (
  <ListHeader>
    <ColHead {...props} className={mainColumnClasses} sortField="metadata.name">
      Name
    </ColHead>
    <ColHead
      {...props}
      className={mainColumnClasses}
      sortField="metadata.namespace"
    >
      Namespace
    </ColHead>
    <ColHead {...props} className={statusColumnClasses}>
      Status
    </ColHead>
    <ColHead {...props} className={hideableColumnClasses}>
      Machine
    </ColHead>
    <ColHead {...props} className={roleColumnClasses}>
      Role
    </ColHead>
    <ColHead
      {...props}
      className={hideableColumnClasses}
      sortField="spec.bmc.address"
    >
      Management Address
    </ColHead>
  </ListHeader>
);

const HostRow = ({ obj: host }) => {
  const {
    metadata: { name, namespace, uid },
    spec: {
      bmc: { address },
    },
  } = host;

  const status = getHostStatus(host);

  return (
    <ResourceRow obj={host}>
      <div className={mainColumnClasses}>
        <ResourceLink
          kind={BaremetalHostModel.kind}
          name={name}
          namespace={namespace}
          title={uid}
        />
      </div>
      <div className={mainColumnClasses}>
        <ResourceLink
          kind={NamespaceModel.kind}
          name={namespace}
          title={namespace}
        />
      </div>
      <div className={statusColumnClasses}>{status}</div>
      <div className={hideableColumnClasses}>-</div>
      <div className={roleColumnClasses}>-</div>
      <div className={hideableColumnClasses}>{address}</div>
    </ResourceRow>
  );
};

const HostList = props => <List {...props} Header={HostHeader} Row={HostRow} />;

const filters = [
  {
    type: 'baremetalhost-status',
    selected: ['online', 'offline'],
    reducer: getHostStatus,
    items: [
      { id: 'online', title: 'online' },
      { id: 'offline', title: 'offline' },
    ],
  },
];

export class BaremetalHostsPage extends React.Component {
  render() {
    return (
      <ListPage
        {...this.props}
        canCreate={true}
        rowFilters={filters}
        createButtonText="Create Host"
        kind={BaremetalHostModel.kind}
        ListComponent={HostList}
      />
    );
  }
}
