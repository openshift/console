import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ClusterOperatorModel } from '../../models';
import { StartGuide } from '../start-guide';
import {
  DetailsPage,
  ListPage,
  Table,
  TableRow,
  TableData,
} from '../factory';
import { Conditions } from '../conditions';
import {
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getStatusAndMessage,
  ClusterOperator,
  K8sResourceKindReference,
  OperandVersion,
  OperatorStatus,
  referenceForModel,
} from '../../module/k8s';
import {
  navFactory,
  EmptyBox,
  Kebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from '../utils';
import { STORAGE_PREFIX } from '../../const';

export const clusterOperatorReference: K8sResourceKindReference = referenceForModel(ClusterOperatorModel);

const getIconClass = (status: OperatorStatus) => {
  return {
    [OperatorStatus.Available]: 'pficon pficon-ok text-success',
    [OperatorStatus.Updating]: 'fa fa-refresh',
    [OperatorStatus.Degraded]: 'pficon pficon-warning-triangle-o text-warning',
    [OperatorStatus.Unknown]: 'pficon pficon-unknown',
  }[status];
};

const OperatorStatusIconAndLabel: React.SFC<OperatorStatusIconAndLabelProps> = ({status}) => {
  const iconClass = getIconClass(status);
  return <React.Fragment><i className={iconClass} aria-hidden="true" /> {status}</React.Fragment>;
};

const tableColumnClasses = [
  classNames('col-md-3', 'col-sm-3', 'col-xs-6'),
  classNames('col-md-2', 'col-sm-3', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-4', 'col-sm-3', 'hidden-xs'),
  Kebab.columnClass,
];

const ClusterOperatorTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status', sortFunc: 'getClusterOperatorStatus', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Version', sortFunc: 'getClusterOperatorVersion', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Message', props: { className: tableColumnClasses[3] },
    },
  ];
};
ClusterOperatorTableHeader.displayName = 'ClusterOperatorTableHeader';

const ClusterOperatorTableRow: React.FC<ClusterOperatorTableRowProps> = ({obj, index, key, style}) => {
  const { status, message } = getStatusAndMessage(obj);
  const operatorVersion = getClusterOperatorVersion(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={clusterOperatorReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <OperatorStatusIconAndLabel status={status} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {operatorVersion || '-'}
      </TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word', 'co-pre-line')}>
        {message ? _.truncate(message, { length: 256, separator: ' ' }) : '-'}
      </TableData>
    </TableRow>
  );
};
ClusterOperatorTableRow.displayName = 'ClusterOperatorTableRow';
type ClusterOperatorTableRowProps = {
  obj: ClusterOperator;
  index: number;
  key?: string;
  style: object;
};

export const ClusterOperatorList: React.SFC = props => <Table {...props} aria-label="Cluster Operators" Header={ClusterOperatorTableHeader} Row={ClusterOperatorTableRow} virtualize />;

const allStatuses = [
  OperatorStatus.Available,
  OperatorStatus.Updating,
  OperatorStatus.Degraded,
  OperatorStatus.Unknown,
];

const filters = [{
  type: 'cluster-operator-status',
  selected: allStatuses,
  reducer: getClusterOperatorStatus,
  items: _.map(allStatuses, phase => ({
    id: phase,
    title: phase,
  })),
}];

export const ClusterOperatorStartGuide: React.SFC<{}> = () =>
  <React.Fragment>
    <h4>What are Cluster Operators?</h4>
    <p>
      An Operator is a method of packaging, deploying, and managing a Kubernetes application. Cluster Operators implement and automate updates of OpenShift and Kubernetes at the cluster level. During an update, the latest versions of the OpenShift and Kubernetes components are downloaded. A rolling update will occur to install the latest versions.
    </p>
  </React.Fragment>;

export const ClusterOperatorPage: React.SFC<ClusterOperatorPageProps> = props =>
  <React.Fragment>
    <StartGuide dismissKey={`${STORAGE_PREFIX}/seen-cluster-operator-guide`} startGuide={<ClusterOperatorStartGuide />} />
    <ListPage
      {...props}
      title="Cluster Operators"
      kind={clusterOperatorReference}
      ListComponent={ClusterOperatorList}
      canCreate={false}
      rowFilters={filters}
    />
  </React.Fragment>;

const OperandVersions: React.SFC<OperandVersionsProps> = ({versions}) => {
  return _.isEmpty(versions)
    ? <EmptyBox label="Versions" />
    : <div className="co-table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          {_.map(versions, ({name, version}, i) => (
            <tr key={i}>
              <td>{name}</td>
              <td>{version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>;
};


const ClusterOperatorDetails: React.SFC<ClusterOperatorDetailsProps> = ({obj}) => {
  const { status, message } = getStatusAndMessage(obj);
  const versions: OperandVersion[] = _.get(obj, 'status.versions', []);
  const conditions = _.get(obj, 'status.conditions', []);
  // Show the operator version in the details overview if it's the only version.
  const operatorVersion = versions.length === 1 && versions[0].name === 'operator'
    ? versions[0].version
    : null;
  return (
    <React.Fragment>
      <div className="co-m-pane__body">
        <SectionHeading text="Cluster Operator Overview" />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} />
          </div>
          <div className="col-sm-6">
            <dl>
              {operatorVersion && <React.Fragment>
                <dt>Version</dt>
                <dd>{operatorVersion}</dd>
              </React.Fragment>}
              <dt>Status</dt>
              <dd><OperatorStatusIconAndLabel status={status} /></dd>
              <dt>Message</dt>
              <dd className="co-pre-line">{message || '-'}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={conditions} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Operand Versions" />
        <OperandVersions versions={versions} />
      </div>
    </React.Fragment>
  );
};

export const ClusterOperatorDetailsPage: React.SFC<ClusterOperatorDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={clusterOperatorReference}
    pages={[navFactory.details(ClusterOperatorDetails), navFactory.editYaml()]}
  />;

type OperatorStatusIconAndLabelProps = {
  status: OperatorStatus;
};

type ClusterOperatorPageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type OperandVersionsProps = {
  versions: OperandVersion[];
};

type ClusterOperatorDetailsProps = {
  obj: ClusterOperator;
};

type ClusterOperatorDetailsPageProps = {
  match: any;
};
