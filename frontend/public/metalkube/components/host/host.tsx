import * as _ from 'lodash-es';
import * as React from 'react';
import { getHostStatus } from 'kubevirt-web-ui-components';
import { connect } from 'react-redux';
import { actions } from '../../../kubevirt/module/okdk8s';

import {
  ListHeader,
  ColHead,
  List,
  ListPage,
  ResourceRow,
} from '../factory/okdfactory';
import { ResourceLink, ResourceKebab } from '../utils/okdutils';
import { BaremetalHostModel, NamespaceModel } from '../../models';
import MachineLink from './MachineLink';
import { menuActions } from './menu-actions';
import { openCreateBaremetalHostModal } from '../modals/create-host-modal';

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
  const machineName = _.get(host, 'status.machineRef.name');

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
      <div className={hideableColumnClasses}>
        <MachineLink name={machineName} />
      </div>
      <div className={roleColumnClasses}>-</div>
      <div className={hideableColumnClasses}>{address}</div>
      <div className="dropdown-kebab-pf">
        <ResourceKebab
          actions={menuActions}
          kind={BaremetalHostModel.kind}
          resource={host}
        />
      </div>
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

const createProps = ns => ({
  onClick: () => openCreateBaremetalHostModal(ns),
});

const mapStateToProps = ({k8s}) => ({
  k8s,
});

const mapDispatchToProps = () => ({
  stopK8sWatch: actions.stopK8sWatch,
  watchK8sList: actions.watchK8sList,
});

/* eslint-disable no-unused-vars, no-undef */
export type BaremetalHostsPageProps = {
  namespace: string;
};
/* eslint-enable no-unused-vars, no-undef */

class BaremetalHostsPage_ extends React.Component<BaremetalHostsPageProps> {
  render() {
    return (
      <ListPage
        {...this.props}
        canCreate
        rowFilters={filters}
        createProps={createProps(this.props.namespace)}
        createButtonText="Add Host"
        kind={BaremetalHostModel.kind}
        ListComponent={HostList}
      />
    );
  }
}

export const BaremetalHostsPage = connect(mapStateToProps, mapDispatchToProps)(BaremetalHostsPage_);
